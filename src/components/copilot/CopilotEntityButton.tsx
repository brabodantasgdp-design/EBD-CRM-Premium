import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { EntityType } from "../../lib/ai/context";

export function CopilotEntityButton({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  return <Link href={`/copilot?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Sparkles className="h-3.5 w-3.5"/> Copilot</Link>;
}
