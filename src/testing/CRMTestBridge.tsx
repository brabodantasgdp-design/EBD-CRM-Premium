"use client";

import { useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import type { ActivityItem, CompanyItem, ContactItem, DealItem, LeadItem, TaskItem } from "../types/crm";

export type NexusE2ESnapshot = {
  leads: LeadItem[];
  contacts: ContactItem[];
  companies: CompanyItem[];
  deals: DealItem[];
  tasks: TaskItem[];
  activities: ActivityItem[];
};

export type NexusE2EBridge = {
  getSnapshot: () => NexusE2ESnapshot;
};

declare global {
  interface Window {
    __NEXUS_E2E__?: NexusE2EBridge;
  }
}

const enabled = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";

function cloneSnapshot(snapshot: NexusE2ESnapshot): NexusE2ESnapshot {
  return structuredClone(snapshot);
}

export function CRMTestBridge() {
  const { leads, contacts, companies, deals, tasks, activities } = useCRM();

  useEffect(() => {
    if (!enabled) return;

    const snapshot = (): NexusE2ESnapshot =>
      cloneSnapshot({ leads, contacts, companies, deals, tasks, activities });

    window.__NEXUS_E2E__ = { getSnapshot: snapshot };
    return () => {
      delete window.__NEXUS_E2E__;
    };
  }, [leads, contacts, companies, deals, tasks, activities]);

  return null;
}

