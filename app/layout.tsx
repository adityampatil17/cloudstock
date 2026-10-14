import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import AuthSessionProvider from "./components/SessionProvider";

export const metadata: Metadata = {
  title: "CloudStock",
  description: "Cloud-based Inventory and Business Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        <AuthSessionProvider>
          <Navbar />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}