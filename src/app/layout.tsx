import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Mundial Quiniela",
  description: "Quiniela administrada para Copa Mundial FIFA 2026",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          {user ? (
            <aside className="sidebar">
              <Link className="brand" href="/dashboard">
                <span className="brand-mark">
                  <Trophy size={20} />
                </span>
                <span>
                  <strong>Mundial</strong>
                  <small>Quiniela 2026</small>
                </span>
              </Link>
              <AppNav role={user.role} canParticipate={user.canParticipate} />
              <form action={logoutAction} className="sidebar-footer">
                <span>{user.displayName}</span>
                <button className="ghost-button" type="submit">
                  Salir
                </button>
              </form>
            </aside>
          ) : null}
          <main className={user ? "content" : "auth-content"}>{children}</main>
        </div>
      </body>
    </html>
  );
}
