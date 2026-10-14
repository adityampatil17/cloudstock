import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "dashboard:view")) {
    redirect("/login");
  }

  const [
    productCount,
    customerCount,
    orderCount,
    invoiceCount,
    salesResult,
    recentOrders,
    allProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.invoice.count(),
    prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
      },
    }),
    prisma.product.findMany({
      orderBy: {
        quantity: "asc",
      },
    }),
  ]);

  const lowStockProducts = allProducts
    .filter((product) => product.quantity <= product.minimumStock)
    .slice(0, 5);

  const lowStockCount = allProducts.filter(
    (product) => product.quantity <= product.minimumStock
  ).length;

  const totalSales = Number(salesResult._sum.totalAmount || 0);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">CloudStock Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Overview of your inventory and business activity
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">📦</div>
            <p className="mt-4 text-sm text-slate-400">Products</p>
            <p className="mt-1 text-3xl font-bold">{productCount}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">👥</div>
            <p className="mt-4 text-sm text-slate-400">Customers</p>
            <p className="mt-1 text-3xl font-bold">{customerCount}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">📋</div>
            <p className="mt-4 text-sm text-slate-400">Orders</p>
            <p className="mt-1 text-3xl font-bold">{orderCount}</p>
          </div>

          <div className="rounded-xl border border-red-900/50 bg-slate-900 p-6">
            <div className="text-3xl">⚠️</div>
            <p className="mt-4 text-sm text-slate-400">
              Products Requiring Restock
            </p>
            <p className="mt-1 text-3xl font-bold text-red-400">
              {lowStockCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              At or below minimum stock
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">🧾</div>
            <p className="mt-4 text-sm text-slate-400">Invoices</p>
            <p className="mt-1 text-3xl font-bold">{invoiceCount}</p>
          </div>

          <div className="rounded-xl border border-green-900/50 bg-slate-900 p-6">
            <div className="text-3xl">💰</div>
            <p className="mt-4 text-sm text-slate-400">Total Sales</p>
            <p className="mt-1 text-3xl font-bold text-green-400">
              ₹{totalSales.toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Excludes cancelled invoices
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="font-semibold">Recent Orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest customer orders
              </p>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No orders yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.customer.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-blue-400">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="font-semibold">Low Stock Products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Products requiring attention
                </p>
              </div>

              {hasPermission(session.user.role, "inventory:view") && (
                <Link
                  href="/inventory"
                  className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-blue-300 transition hover:border-blue-500 hover:bg-blue-500/10"
                >
                  View Inventory →
                </Link>
              )}
            </div>

            {lowStockCount > 0 && (
              <div className="border-b border-red-900/40 bg-red-500/5 px-6 py-3">
                <p className="text-sm text-red-300">
                  {lowStockCount} product(s) need attention.
                </p>
              </div>
            )}

            {lowStockProducts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-3 font-medium text-green-400">
                  All products are sufficiently stocked
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  No products are at or below their minimum stock level.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {product.productCode}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-red-400">
                        {product.quantity} left
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Minimum: {product.minimumStock}
                      </p>
                      {product.quantity === 0 && (
                        <p className="mt-1 text-xs font-medium text-red-300">
                          Out of stock
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lowStockCount > 5 && (
              <div className="border-t border-slate-800 px-6 py-3 text-sm text-slate-400">
                Showing 5 of {lowStockCount} products requiring restock.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}