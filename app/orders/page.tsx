
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import CreateOrderForm from "./CreateOrderForm";
import GenerateInvoiceButton from "./GenerateInvoiceButton";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "orders:view")) {
    redirect("/");
  }

  const canManageOrders = hasPermission(
    session.user.role,
    "orders:manage"
  );

  const canManageInvoices = hasPermission(
    session.user.role,
    "invoices:manage"
  );

  const [orders, customers, products] = await Promise.all([
    prisma.order.findMany({
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {canManageOrders && (
          <CreateOrderForm
  customers={customers.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }))}
  products={products.map((product) => ({
    ...product,
    purchasePrice: product.purchasePrice.toString(),
    sellingPrice: product.sellingPrice.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }))}
/>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="mt-2 text-slate-400">
            Manage customer orders and track order status
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold">Orders</h2>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length} order(s)
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">📋</div>
              <h3 className="mt-4 text-lg font-semibold">
                No orders yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Orders created by sales staff will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {order.orderNumber}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {order.customer.name}
                        </div>
                        {order.customer.company && (
                          <div className="mt-1 text-xs text-slate-500">
                            {order.customer.company}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-slate-300">
                              {item.product.name}
                              <span className="ml-2 text-xs text-slate-500">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {order.items.reduce(
                          (total, item) => total + item.quantity,
                          0
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        {order.status === "CONFIRMED" && (
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                            Confirmed
                          </span>
                        )}
                        {order.status === "PENDING" && (
                          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                            Pending
                          </span>
                        )}
                        {order.status === "COMPLETED" && (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                            Completed
                          </span>
                        )}
                        {order.status === "CANCELLED" && (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                            Cancelled
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {order.invoice ? (
                          <span className="font-mono text-xs text-green-400">
                            {order.invoice.invoiceNumber}
                          </span>
                        ) : canManageInvoices ? (
                          <GenerateInvoiceButton orderId={order.id} />
                        ) : (
                          <span className="text-xs text-slate-500">
                            Not generated
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {order.createdAt.toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
