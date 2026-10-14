
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

const ALLOWED_REASONS = [
  "RESTOCK",
  "DAMAGE",
  "CORRECTION",
  "RETURN",
  "OTHER",
] as const;

class StockAdjustmentError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "StockAdjustmentError";
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    let body: {
      change?: unknown;
      reason?: unknown;
      notes?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const change = body.change;
    const reason = body.reason;
    const notes = body.notes;

    if (
      typeof change !== "number" ||
      !Number.isSafeInteger(change) ||
      change === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Change must be a non-zero whole number.",
        },
        { status: 400 }
      );
    }

    if (
      typeof reason !== "string" ||
      !ALLOWED_REASONS.includes(
        reason as (typeof ALLOWED_REASONS)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Select a valid stock adjustment reason." },
        { status: 400 }
      );
    }

    if (
      notes !== undefined &&
      notes !== null &&
      (typeof notes !== "string" || notes.length > 500)
    ) {
      return NextResponse.json(
        { success: false, message: "Notes must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    const cleanNotes =
      typeof notes === "string" && notes.trim()
        ? notes.trim()
        : null;

    const email = auth.user.email;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Unable to identify the signed-in user." },
        { status: 401 }
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        throw new StockAdjustmentError(
          "Your user account was not found. Please sign in again.",
          401
        );
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          productCode: true,
          name: true,
          quantity: true,
        },
      });

      if (!product) {
        throw new StockAdjustmentError("Product not found.", 404);
      }

      const previousStock = product.quantity;
      const newStock = previousStock + change;

      if (!Number.isSafeInteger(newStock) || newStock < 0) {
        throw new StockAdjustmentError(
          "This adjustment would make stock negative or invalid.",
          400
        );
      }

      // Update only if stock still matches what we read.
      // This prevents simultaneous adjustments from silently overwriting each other.
      const update = await tx.product.updateMany({
        where: {
          id: productId,
          quantity: previousStock,
        },
        data: {
          quantity: { increment: change },
        },
      });

      if (update.count !== 1) {
        throw new StockAdjustmentError(
          "Stock changed during this request. Refresh the page and try again.",
          409
        );
      }

      return tx.stockMovement.create({
        data: {
          productId,
          userId: user.id,
          change,
          previousStock,
          newStock,
          reason,
          notes: cleanNotes,
        },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Stock adjusted successfully.",
      movement,
    });
  } catch (error) {
    if (error instanceof StockAdjustmentError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }

    console.error("Adjust stock error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to adjust stock. Check the server logs." },
      { status: 500 }
    );
  }
}
