import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requirePermission("orders:manage");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const customerId = Number(body.customerId);
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer, product and valid quantity are required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error("Customer not found.");
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found.");
      }

      if (product.quantity < quantity) {
        throw new Error(
          `Not enough stock. Only ${product.quantity} units are available.`
        );
      }

      const user = await tx.user.findUnique({
        where: {
          email: auth.user.email!,
        },
      });

      if (!user) {
        throw new Error("Authenticated user not found.");
      }

      const previousStock = product.quantity;
      const newStock = previousStock - quantity;
      const totalAmount = Number(product.sellingPrice) * quantity;
      const orderNumber = `ORD-${Date.now()}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          userId: user.id,
          status: "CONFIRMED",
          totalAmount: String(totalAmount),
          items: {
            create: {
              productId,
              quantity,
              unitPrice: product.sellingPrice,
              totalPrice: String(totalAmount),
            },
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update stock only if the quantity has not changed
      // since it was read, preventing overselling.
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: productId,
          quantity: { gte: quantity },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      if (stockUpdate.count !== 1) {
        throw new Error(
          "Stock changed while creating the order. Please try again."
        );
      }

      // Record the stock deduction in the same transaction.
      await tx.stockMovement.create({
        data: {
          productId,
          userId: user.id,
          change: -quantity,
          previousStock,
          newStock,
          reason: "ORDER",
          notes: `Stock deducted for order ${orderNumber}`,
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create order.";

    const status =
      message === "Customer not found." ||
      message === "Product not found."
        ? 404
        : message.startsWith("Not enough stock.") ||
            message.startsWith("Stock changed while creating the order.")
          ? 400
          : message === "Authenticated user not found."
            ? 401
            : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}