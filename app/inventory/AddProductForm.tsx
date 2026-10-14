"use client";

import { FormEvent, useState } from "react";

export default function AddProductForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Save the form reference BEFORE the await
    const formElement = event.currentTarget;

    setLoading(true);
    setMessage("");

    const form = new FormData(formElement);

    const data = {
      productCode: form.get("productCode"),
      name: form.get("name"),
      category: form.get("category"),
      description: form.get("description"),
      purchasePrice: form.get("purchasePrice"),
      sellingPrice: form.get("sellingPrice"),
      quantity: form.get("quantity"),
      minimumStock: form.get("minimumStock"),
      supplier: form.get("supplier"),
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed to add product.");
        return;
      }

      setMessage("Product added successfully!");

      // Use the saved form reference
      formElement.reset();

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Add product error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <h2 className="text-xl font-semibold">Add Product</h2>

      <p className="mt-1 text-sm text-slate-400">
        Add a new product to your cloud inventory.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          name="productCode"
          placeholder="Product Code *"
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="name"
          placeholder="Product Name *"
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="category"
          placeholder="Category *"
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="supplier"
          placeholder="Supplier"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="purchasePrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Purchase Price"
          defaultValue="0"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="sellingPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Selling Price"
          defaultValue="0"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="quantity"
          type="number"
          min="0"
          placeholder="Current Quantity"
          defaultValue="0"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          name="minimumStock"
          type="number"
          min="0"
          placeholder="Minimum Stock"
          defaultValue="5"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <textarea
          name="description"
          placeholder="Description"
          rows={3}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 md:col-span-2"
        />
      </div>

      {message && (
        <p className="mt-4 text-sm text-blue-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}