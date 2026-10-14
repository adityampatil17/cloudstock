
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/", icon: "🏠", roles: ["ADMIN", "SALES", "WAREHOUSE"] },
  { name: "Inventory", href: "/inventory", icon: "📦", roles: ["ADMIN", "SALES", "WAREHOUSE"] },
  { name: "Customers", href: "/customers", icon: "👥", roles: ["ADMIN", "SALES", "WAREHOUSE"] },
  { name: "Orders", href: "/orders", icon: "📋", roles: ["ADMIN", "SALES", "WAREHOUSE"] },
  { name: "Invoices", href: "/invoices", icon: "🧾", roles: ["ADMIN", "SALES"] },
  { name: "Users", href: "/users", icon: "👤", roles: ["ADMIN"] },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(session?.user?.role ?? "")
  );

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl">
              ☁
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">CloudStock</h1>
              <p className="text-xs text-slate-500">
                Inventory Management
              </p>
            </div>
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <nav className="flex flex-wrap items-center gap-2">
              {visibleNavigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {status === "authenticated" && session.user && (
              <div className="flex items-center gap-3 border-t border-slate-800 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {session.user.name}
                  </p>

                  <p className="text-xs text-blue-400">
                    {session.user.role}
                  </p>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
