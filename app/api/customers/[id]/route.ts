import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requirePermission("customers:manage");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const customerId = Number(id);

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const company =
      typeof body.company === "string" ? body.company.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Customer name is required." },
        { status: 400 }
      );
    }

    if (
      name.length > 200 ||
      company.length > 200 ||
      phone.length > 50 ||
      email.length > 320 ||
      address.length > 2000
    ) {
      return NextResponse.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400 }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        company: company || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update customer." },
      { status: 500 }
    );
  }
}