"use client";

import { FormEvent, useState } from "react";

export default function AddCustomerForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;

    setLoading(true);
    setMessage("");

    const form = new FormData(formElement);

    const data = {
      name: form.get("name"),
      company: form.get("company"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed to add customer.");
        return;
      }

      setMessage("Customer added successfully!");

      formElement.reset();

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Add customer error:", error);
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
      <h2 className="text-xl font-semibold">Add Customer</h2>

      <p className="mt-1 text-sm text-slate-400">
        Add a new customer to your cloud database.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          name="name"
          placeholder="Customer Name *"
          required
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        />

        <input
          name="company"
          placeholder="Company"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
        />

        <textarea
          name="address"
          placeholder="Address"
          rows={3}
          className="md:col-span-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
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
        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Customer"}
      </button>
    </form>
  );
}