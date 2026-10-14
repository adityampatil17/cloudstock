"use client";

import { useState } from "react";

export default function GenerateInvoiceButton({
  orderId,
}: {
  orderId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateInvoice() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed");
        return;
      }

      setMessage("Invoice created!");

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={generateInvoice}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium hover:bg-green-500 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Generate Invoice"}
      </button>

      {message && (
        <p className="mt-1 text-xs text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}