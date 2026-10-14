"use client";

import { useState } from "react";
import EditCustomerForm, { type CustomerData } from "./EditCustomerForm";

type Props = {
  customer: CustomerData;
};

export default function EditCustomerButton({ customer }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-blue-500/50 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10"
      >
        Edit
      </button>

      {editing && (
        <EditCustomerForm
          customer={customer}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}