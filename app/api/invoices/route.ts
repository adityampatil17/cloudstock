
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requirePermission("invoices:manage");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const orderId = Number(body.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid Order ID is required.",
        },
        { status: 400 }
      );
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: true,
        },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      // Prevent duplicate invoices
      const existingInvoice = await tx.invoice.findUnique({
        where: { orderId },
      });

      if (existingInvoice) {
        throw new Error(
          "An invoice already exists for this order."
        );
      }

      // 18% GST for the demo
      const subtotal = Number(order.totalAmount);
      const taxAmount = subtotal * 0.18;
      const totalAmount = subtotal + taxAmount;

      // Attribute the invoice to the logged-in user
      const user = await tx.user.findUnique({
        where: { email: auth.user.email! },
      });

      if (!user) {
        throw new Error("Authenticated user not found.");
      }

      const invoiceNumber = `INV-${Date.now()}`;

      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerId: order.customerId,
          userId: user.id,
          subtotal: String(subtotal),
          taxAmount: String(taxAmount),
          totalAmount: String(totalAmount),
          status: "ISSUED",
          issuedAt: new Date(),
        },
        include: {
          customer: true,
          order: true,
        },
      });

      return newInvoice;
    });

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create invoice.";

    let status = 500;

    if (message === "Order not found.") {
      status = 404;
    } else if (
      message === "An invoice already exists for this order."
    ) {
      status = 409;
    } else if (
      message === "Authenticated user not found."
    ) {
      status = 401;
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
