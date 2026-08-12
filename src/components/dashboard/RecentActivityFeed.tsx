import React from "react";
import { Activity, Briefcase, PhoneCall, CheckCircle2, FileText } from "lucide-react";
import { ActivityFeedItem } from "../../types/crm";

interface RecentActivityFeedProps {
  activities: ActivityFeedItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
}) => {
  const renderActivityIcon = (type: ActivityFeedItem["type"]) => {
    switch (type) {
      case "deal_moved":
        return <Briefcase className="h-3.5 w-3.5 text-indigo-600" />;
      case "call_logged":
        return <PhoneCall className="h-3.5 w-3.5 text-blue-600" />;
      case "deal_won":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case "proposal_added":
        return <FileText className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Atividade recente
              </h3>
              <p className="text-xs text-slate-500">
                Feed operacional recente
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Atualizações
          </span>
        </div>

        {/* Feed timeline */}
        <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 relative z-10">
              <img
                src={act.user.avatar}
                alt={act.user.name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white shrink-0 shadow-2xs"
              />

              <div className="flex-1 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900">
                    {act.user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {act.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500">{act.action}</span>
                  <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {act.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <span className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
          Ver histórico completo de atividades →
        </span>
      </div>
    </div>
  );
};
