import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CRMDataProvider } from "../context/CRMContext";
import "../index.css";

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "Nexus CRM B2B Enterprise Suite",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <CRMDataProvider>{children}</CRMDataProvider>
      </body>
    </html>
  );
}
