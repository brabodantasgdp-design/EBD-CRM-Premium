"use client";

import type { ReactNode } from "react";
import { CRMDataProvider } from "../context/CRMContext";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <CRMDataProvider>{children}</CRMDataProvider>;
}
