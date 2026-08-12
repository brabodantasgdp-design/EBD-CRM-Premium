"use client";

import type { ReactNode } from "react";
import { CRMDataProvider } from "../context/CRMContext";
import { CRMTestBridge } from "../testing/CRMTestBridge";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <CRMDataProvider>
      {children}
      <CRMTestBridge />
    </CRMDataProvider>
  );
}
