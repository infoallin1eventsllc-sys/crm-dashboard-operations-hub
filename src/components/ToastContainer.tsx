import React from "react";
import { useCRM } from "../context/CRMContext";
import { motion, AnimatePresence } from "motion/react";
import { Check, Info, AlertCircle, X, CloudLightning } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCRM();

  return (
    <div 
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3.5 max-w-sm w-full pointer-events-none"
      id="global-toast-container"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3.5 relative overflow-hidden"
              id={`toast-item-${toast.id}`}
            >
              {/* Type Indicator Accent Line */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-2 ${
                  isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-[#FFD700]"
                }`}
              />

              {/* Icon */}
              <div 
                className={`p-1.5 shrink-0 border border-black ${
                  isSuccess 
                    ? "bg-emerald-50 text-emerald-700" 
                    : isError 
                    ? "bg-red-50 text-red-700" 
                    : "bg-yellow-50 text-yellow-800"
                }`}
              >
                {isSuccess ? (
                  <Check size={14} className="stroke-[3]" />
                ) : isError ? (
                  <AlertCircle size={14} className="stroke-[3]" />
                ) : (
                  <Info size={14} className="stroke-[3]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-black/45 flex items-center gap-1">
                    <CloudLightning size={10} className="animate-pulse text-amber-500" />
                    Cloud Sync Active
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-black leading-snug">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="absolute top-3.5 right-3.5 text-black/40 hover:text-black hover:bg-black/5 p-1 border border-transparent hover:border-black/10 rounded-none transition cursor-pointer"
                id={`toast-close-${toast.id}`}
                title="Dismiss message"
              >
                <X size={12} className="stroke-[2.5]" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
