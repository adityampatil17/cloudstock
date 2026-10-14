
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requirePermission("inventory:view");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission("inventory:manage");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const {
      productCode,
      name,
      category,
      description,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
      supplier,
    } = body;

    if (!productCode || !name || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Product code, name and category are required.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        productCode,
        name,
        category,
        description: description || null,
        purchasePrice: String(purchasePrice),
        sellingPrice: String(sellingPrice),
        quantity: Number(quantity) || 0,
        minimumStock: Number(minimumStock) || 5,
        supplier: supplier || null,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error("Create product error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this product code already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create product." },
      { status: 500 }
    );
  }
}
