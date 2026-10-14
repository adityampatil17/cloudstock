
export type UserRole = "ADMIN" | "SALES" | "WAREHOUSE";

export type Permission =
  | "dashboard:view"
  | "inventory:view"
  | "inventory:manage"
  | "customers:view"
  | "customers:manage"
  | "orders:view"
  | "orders:manage"
  | "invoices:view"
  | "invoices:manage"
  | "users:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "inventory:view",
    "inventory:manage",
    "customers:view",
    "customers:manage",
    "orders:view",
    "orders:manage",
    "invoices:view",
    "invoices:manage",
    "users:manage",
  ],

  SALES: [
    "dashboard:view",
    "inventory:view",
    "customers:view",
    "customers:manage",
    "orders:view",
    "orders:manage",
    "invoices:view",
    "invoices:manage",
  ],

  WAREHOUSE: [
    "dashboard:view",
    "inventory:view",
    "inventory:manage",
    "customers:view",
    "orders:view",
  ],
};

export function hasPermission(
  role: UserRole | string | undefined,
  permission: Permission
): boolean {
  if (!role || !(role in rolePermissions)) {
    return false;
  }

  return rolePermissions[role as UserRole].includes(permission);
}
