"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EditProductForm from "./EditProductForm";

type StockActionsProps = {
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  canManage: boolean;
};

type ProductData = {
  id: number;
  productCode: string;
  name: string;
  category: string;
  description: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  quantity: number;
  minimumStock: number;
  supplier: string | null;
};

type Movement = {
  id: number;
  change: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes: string | null;
  createdAt: string;
  user: { name: string; role: string };
};

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    throw new Error(
      `Server returned an empty response (HTTP ${response.status}).`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an unexpected response (HTTP ${response.status}). Check the VS Code terminal for the server error.`
    );
  }
}

export default function StockActions({
  productId,
  productName,
  productCode,
  quantity,
  canManage,
}: StockActionsProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"adjust" | "history" | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(
    null
  );
  const [change, setChange] = useState("1");
  const [reason, setReason] = useState("RESTOCK");
  const [notes, setNotes] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadHistory() {
    setError("");
    setMovements([]);
    setBusy(true);

    try {
      const response = await fetch(
        `/api/products/${productId}/stock-movements`,
        { cache: "no-store" }
      );

      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load stock history.");
      }

      setMovements(data.movements);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load history."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openEditProduct() {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const response = await fetch(`/api/products`, {
        cache: "no-store",
      });
      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load product details.");
      }

      const product = (data.products as ProductData[]).find(
        (item) => item.id === productId
      );

      if (!product) {
        throw new Error("Product not found. Refresh the inventory and try again.");
      }

      setEditingProduct(product);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load product details."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitAdjustment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(change);

    if (!Number.isSafeInteger(amount) || amount === 0) {
      setError("Enter a non-zero whole number.");
      return;
    }

    if (quantity + amount < 0) {
      setError("Stock cannot become negative.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/products/${productId}/adjust-stock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ change: amount, reason, notes }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Stock adjustment failed.");
      }

      setMessage(
        `Stock updated: ${data.movement.previousStock} → ${data.movement.newStock}`
      );

      setChange("1");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Stock adjustment failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openHistory() {
    setMode("history");
    await loadHistory();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canManage && (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("adjust");
                setError("");
                setMessage("");
              }}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium hover:bg-blue-500"
            >
              Adjust Stock
            </button>

            <button
              type="button"
              onClick={openEditProduct}
              disabled={busy}
              className="rounded-lg border border-blue-500/50 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
            >
              {busy ? "Loading..." : "Edit Product"}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={openHistory}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium hover:bg-slate-800"
        >
          View History
        </button>
      </div>

      {error && !mode && !editingProduct && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            router.refresh();
          }}
        />
      )}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-dialog-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="stock-dialog-title" className="text-xl font-bold">
                  {mode === "adjust"
                    ? "Adjust Stock"
                    : "Stock Movement History"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {productName} ({productCode}) · Current stock: {quantity}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => setMode(null)}
                className="rounded-lg px-3 py-1 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {mode === "adjust" ? (
              <form onSubmit={submitAdjustment} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm" htmlFor={`stock-change-${productId}`}>
                    Quantity change
                  </label>
                  <input
                    id={`stock-change-${productId}`}
                    type="number"
                    step="1"
                    required
                    value={change}
                    onChange={(event) => setChange(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Positive adds stock; negative removes stock.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm" htmlFor={`stock-reason-${productId}`}>
                    Reason
                  </label>
                  <select
                    id={`stock-reason-${productId}`}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  >
                    <option value="RESTOCK">Restock</option>
                    <option value="DAMAGE">Damaged items</option>
                    <option value="CORRECTION">Stock correction</option>
                    <option value="RETURN">Customer return</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm" htmlFor={`stock-notes-${productId}`}>
                    Notes (optional)
                  </label>
                  <textarea
                    id={`stock-notes-${productId}`}
                    maxLength={500}
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  />
                </div>

                {message && (
                  <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                    {message}
                  </p>
                )}

                {error && (
                  <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Save Adjustment"}
                </button>
              </form>
            ) : (
              <div>
                {busy && (
                  <p className="py-4 text-slate-400">Loading history...</p>
                )}

                {error && (
                  <p role="alert" className="py-4 text-red-400">
                    {error}
                  </p>
                )}

                {!busy && !error && movements.length === 0 && (
                  <p className="py-4 text-slate-400">
                    No stock movements found.
                  </p>
                )}

                {!busy && movements.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="py-3 pr-3">Date</th>
                          <th className="py-3 pr-3">Change</th>
                          <th className="py-3 pr-3">Stock</th>
                          <th className="py-3">Reason / User</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-800 align-top"
                          >
                            <td className="py-3 pr-3 text-slate-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                            <td
                              className={`py-3 pr-3 ${
                                item.change > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.change > 0 ? "+" : ""}
                              {item.change}
                            </td>
                            <td className="py-3 pr-3">
                              {item.previousStock} → {item.newStock}
                            </td>
                            <td className="py-3">
                              <div>{item.reason}</div>
                              <div className="text-xs text-slate-400">
                                {item.user.name} · {item.user.role}
                              </div>
                              {item.notes && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {item.notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}