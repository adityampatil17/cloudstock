
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("inventory:view");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        productCode: true,
        name: true,
        quantity: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      product,
      movements,
    });
  } catch (error) {
    console.error("Fetch stock movements error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch stock history." },
      { status: 500 }
    );
  }
}
