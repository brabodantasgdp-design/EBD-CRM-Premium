import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300">
      {type === "success" && (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      )}
      {type === "error" && (
        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
      )}
      {type === "info" && <Info className="h-4 w-4 text-indigo-400 shrink-0" />}

      <span>{message}</span>

      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
