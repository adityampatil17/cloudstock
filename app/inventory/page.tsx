
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission } from "@/lib/permissions";
import AddProductForm from "./AddProductForm";
import StockActions from "./StockActions";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "inventory:view")) {
    redirect("/");
  }

  const canManageInventory = hasPermission(
    session.user.role,
    "inventory:manage"
  );

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {canManageInventory && <AddProductForm />}

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="mt-2 text-slate-400">
              Manage your electronics parts inventory
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold">Products</h2>
            <p className="mt-1 text-sm text-slate-500">
              {products.length} product(s) in inventory
            </p>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">📦</div>
              <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Add your first product to start managing inventory.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">Product Code</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Min. Stock</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const lowStock =
                      product.quantity <= product.minimumStock;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-slate-800 last:border-0"
                      >
                        <td className="px-6 py-4 font-mono text-slate-300">
                          {product.productCode}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {product.category}
                        </td>
                        <td className="px-6 py-4">{product.quantity}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {product.minimumStock}
                        </td>
                        <td className="px-6 py-4">
                          ₹{Number(product.sellingPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {lowStock ? (
                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                              Low Stock
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="min-w-64 px-6 py-4">
                          <StockActions
                            productId={product.id}
                            productName={product.name}
                            productCode={product.productCode}
                            quantity={product.quantity}
                            canManage={canManageInventory}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
