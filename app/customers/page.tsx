import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission } from "@/lib/permissions";
import AddCustomerForm from "./AddCustomerForm";
import EditCustomerButton from "./EditCustomerButton";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "customers:view")) {
    redirect("/");
  }

  const canManageCustomers = hasPermission(
    session.user.role,
    "customers:manage"
  );

  const customers = await prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {canManageCustomers && <AddCustomerForm />}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="mt-2 text-slate-400">
            Manage your customers and their information
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold">Customers</h2>
            <p className="mt-1 text-sm text-slate-500">
              {customers.length} customer(s) registered
            </p>
          </div>

          {customers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">👥</div>
              <h3 className="mt-4 text-lg font-semibold">
                No customers yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Add your first customer to start managing customer records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Address</th>
                    {canManageCustomers && (
                      <th className="px-6 py-4">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {customer.company || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {customer.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {customer.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {customer.address || "-"}
                      </td>

                      {canManageCustomers && (
                        <td className="px-6 py-4">
                          <EditCustomerButton customer={customer} />
                        </td>
                      )}
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