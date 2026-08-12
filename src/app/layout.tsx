import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "../index.css";

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "Nexus CRM B2B Enterprise Suite",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
