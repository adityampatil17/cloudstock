"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

type EditProductFormProps = {
  product: ProductData;
  onClose: () => void;
};

export default function EditProductForm({
  product,
  onClose,
}: EditProductFormProps) {
  const router = useRouter();

  const [productCode, setProductCode] = useState(product.productCode);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    String(product.purchasePrice)
  );
  const [sellingPrice, setSellingPrice] = useState(
    String(product.sellingPrice)
  );
  const [minimumStock, setMinimumStock] = useState(
    String(product.minimumStock)
  );
  const [supplier, setSupplier] = useState(product.supplier ?? "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !productCode.trim() ||
      !name.trim() ||
      !category.trim() ||
      purchasePrice.trim() === "" ||
      sellingPrice.trim() === "" ||
      minimumStock.trim() === ""
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const purchase = Number(purchasePrice);
    const selling = Number(sellingPrice);
    const minimum = Number(minimumStock);

    if (
      !Number.isFinite(purchase) ||
      !Number.isFinite(selling) ||
      purchase < 0 ||
      selling < 0
    ) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }

    if (!Number.isSafeInteger(minimum) || minimum < 0) {
      setError("Minimum stock must be a non-negative whole number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productCode: productCode.trim(),
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          purchasePrice: purchase,
          sellingPrice: selling,
          minimumStock: minimum,
          supplier: supplier.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setError(result?.message ?? "Failed to update product.");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error("Update product request failed:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const labelClass = "block text-sm font-medium text-slate-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-product-title"
              className="text-xl font-bold text-white"
            >
              Edit Product
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Update details for {product.productCode}. Current stock:{" "}
              {product.quantity} units.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit product form"
            className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="edit-product-code">
                Product Code *
              </label>
              <input
                id="edit-product-code"
                className={inputClass}
                value={productCode}
                onChange={(event) => setProductCode(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-product-name">
                Product Name *
              </label>
              <input
                id="edit-product-name"
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-product-category">
                Category *
              </label>
              <input
                id="edit-product-category"
                className={inputClass}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-product-supplier">
                Supplier
              </label>
              <input
                id="edit-product-supplier"
                className={inputClass}
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-purchase-price">
                Purchase Price (₹) *
              </label>
              <input
                id="edit-purchase-price"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-selling-price">
                Selling Price (₹) *
              </label>
              <input
                id="edit-selling-price"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-minimum-stock">
                Minimum Stock Alert *
              </label>
              <input
                id="edit-minimum-stock"
                type="number"
                min="0"
                step="1"
                className={inputClass}
                value={minimumStock}
                onChange={(event) => setMinimumStock(event.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-current-stock">
                Current Stock
              </label>
              <input
                id="edit-current-stock"
                type="number"
                className={`${inputClass} cursor-not-allowed text-slate-400`}
                value={product.quantity}
                readOnly
                disabled
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-product-description">
              Description
            </label>
            <textarea
              id="edit-product-description"
              className={inputClass}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}