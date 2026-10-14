
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(session.user.role, permission)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, message: "You do not have permission." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}
