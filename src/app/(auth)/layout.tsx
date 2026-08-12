import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <main className="min-h-screen bg-slate-950">{children}</main>;
}
