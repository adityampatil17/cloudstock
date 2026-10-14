"use client";

import { FormEvent, useState } from "react";

type Customer = {
  id: number;
  name: string;
  company: string | null;
};

type Product = {
  id: number;
  productCode: string;
  name: string;
  sellingPrice: string;
  quantity: number;
};

export default function CreateOrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: Product[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: Number(customerId),
          productId: Number(productId),
          quantity: Number(quantity),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed to create order.");
        return;
      }

      setMessage(
        `Order ${result.order.orderNumber} created successfully!`
      );

      setCustomerId("");
      setProductId("");
      setQuantity("1");

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      console.error("Create order error:", error);
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
      <h2 className="text-xl font-semibold">Create Order</h2>

      <p className="mt-1 text-sm text-slate-400">
        Select a customer and product to create an order.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        >
          <option value="">Select Customer *</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.company ? ` - ${customer.company}` : ""}
            </option>
          ))}
        </select>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        >
          <option value="">Select Product *</option>

          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productCode} - {product.name} ({product.quantity} available)
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        />
      </div>

      {selectedProduct && (
        <p className="mt-4 text-sm text-slate-400">
          Price: ₹{Number(selectedProduct.sellingPrice).toFixed(2)} each
          {" • "}
          Available: {selectedProduct.quantity}
        </p>
      )}

      {message && (
        <p className="mt-4 text-sm text-blue-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || customers.length === 0 || products.length === 0}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}