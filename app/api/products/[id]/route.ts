import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requirePermission("inventory:manage");

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

    const body = await request.json();

    const productCode =
      typeof body.productCode === "string" ? body.productCode.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const supplier =
      typeof body.supplier === "string" ? body.supplier.trim() : "";

    const purchasePrice = Number(body.purchasePrice);
    const sellingPrice = Number(body.sellingPrice);
    const minimumStock = Number(body.minimumStock);

    if (!productCode || !name || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Product code, name and category are required.",
        },
        { status: 400 }
      );
    }

    if (
      productCode.length > 100 ||
      name.length > 200 ||
      category.length > 100 ||
      description.length > 2000 ||
      supplier.length > 200
    ) {
      return NextResponse.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      purchasePrice < 0 ||
      sellingPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Prices must be valid non-negative numbers.",
        },
        { status: 400 }
      );
    }

    if (!Number.isSafeInteger(minimumStock) || minimumStock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum stock must be a non-negative whole number.",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        productCode,
        name,
        category,
        description: description || null,
        purchasePrice: String(purchasePrice),
        sellingPrice: String(sellingPrice),
        minimumStock,
        supplier: supplier || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error: unknown) {
    console.error("Update product error:", error);

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

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update product." },
      { status: 500 }
    );
  }
}