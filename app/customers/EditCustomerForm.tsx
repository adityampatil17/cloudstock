"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type CustomerData = {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type EditCustomerFormProps = {
  customer: CustomerData;
  onClose: () => void;
};

export default function EditCustomerForm({
  customer,
  onClose,
}: EditCustomerFormProps) {
  const router = useRouter();

  const [name, setName] = useState(customer.name);
  const [company, setCompany] = useState(customer.company ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const labelClass = "block text-sm font-medium text-slate-300";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setError(result?.message ?? "Failed to update customer.");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error("Update customer request failed:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
        className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-customer-title" className="text-xl font-bold">
              Edit Customer
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Update customer contact information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit customer form"
            className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customer-name" className={labelClass}>
              Customer Name *
            </label>
            <input
              id="customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="customer-company" className={labelClass}>
              Company
            </label>
            <input
              id="customer-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className={inputClass}
              maxLength={200}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer-phone" className={labelClass}>
                Phone
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="customer-email" className={labelClass}>
                Email
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                maxLength={320}
              />
            </div>
          </div>

          <div>
            <label htmlFor="customer-address" className={labelClass}>
              Address
            </label>
            <textarea
              id="customer-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={inputClass}
              rows={3}
              maxLength={2000}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
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
      </section>
    </div>
  );
}