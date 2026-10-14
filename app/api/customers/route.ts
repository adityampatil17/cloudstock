
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requirePermission("customers:view");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Fetch customers error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch customers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission("customers:manage");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { name, company, phone, email, address } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create customer." },
      { status: 500 }
    );
  }
}
