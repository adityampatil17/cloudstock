
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "invoices:view")) {
    redirect("/");
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      order: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="mt-2 text-slate-400">
            Manage customer invoices and billing records
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold">Invoices</h2>
            <p className="mt-1 text-sm text-slate-500">
              {invoices.length} invoice(s)
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">🧾</div>
              <h3 className="mt-4 text-lg font-semibold">
                No invoices yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Invoices generated for customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Subtotal</th>
                    <th className="px-6 py-4">Tax</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-400">
                        {invoice.order.orderNumber}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {invoice.customer.name}
                      </td>

                      <td className="px-6 py-4">
                        ₹{Number(invoice.subtotal).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        ₹{Number(invoice.taxAmount).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        ₹{Number(invoice.totalAmount).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        {invoice.status === "DRAFT" && (
                          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                            Draft
                          </span>
                        )}

                        {invoice.status === "ISSUED" && (
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                            Issued
                          </span>
                        )}

                        {invoice.status === "PAID" && (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                            Paid
                          </span>
                        )}

                        {invoice.status === "CANCELLED" && (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                            Cancelled
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {invoice.createdAt.toLocaleDateString("en-IN")}
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
