"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastPayload = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

type ActiveToast = {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
  expiresAt: number;
};

const TOAST_EVENT = "gridmine-global-toast";
const TOAST_STORAGE_KEY = "gridmine-global-toast-active";

export function showGlobalToast({
  title,
  message = "",
  type = "success",
  duration = 2600,
}: ToastPayload) {
  if (typeof window === "undefined") return;

  const toast: ActiveToast = {
    id: Date.now(),
    title,
    message,
    type,
    duration,
    expiresAt: Date.now() + duration,
  };

  sessionStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify(toast));

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: toast,
    })
  );
}

export default function GlobalToast() {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    sessionStorage.removeItem(TOAST_STORAGE_KEY);
    setToast(null);
  };

  const activateToast = (nextToast: ActiveToast) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const remaining = nextToast.expiresAt - Date.now();

    if (remaining <= 0) {
      sessionStorage.removeItem(TOAST_STORAGE_KEY);
      setToast(null);
      return;
    }

    setToast({
      ...nextToast,
      duration: remaining,
    });

    timerRef.current = setTimeout(() => {
      sessionStorage.removeItem(TOAST_STORAGE_KEY);
      setToast(null);
      timerRef.current = null;
    }, remaining);
  };

  useEffect(() => {
    // Restore toast after route reload / page remount
    const storedToast = sessionStorage.getItem(TOAST_STORAGE_KEY);

    if (storedToast) {
      try {
        const parsedToast = JSON.parse(storedToast) as ActiveToast;
        activateToast(parsedToast);
      } catch {
        sessionStorage.removeItem(TOAST_STORAGE_KEY);
      }
    }

    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ActiveToast>;
      activateToast(customEvent.detail);
    };

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  const Icon =
    toast.type === "error"
      ? CircleAlert
      : toast.type === "info"
        ? Info
        : CheckCircle2;

        ;

  return (
    <div
      key={toast.id}
      className="fixed bottom-6 right-6 z-[99999] w-[320px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
          <Icon
            size={20}
            className={
              toast.type === "error"
                ? "text-red-400"
                : toast.type === "info"
                  ? "text-blue-400"
                  : "text-emerald-400"
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {toast.title}
          </p>

          {toast.message && (
            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              {toast.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={clearToast}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className={`h-[3px] ${
          toast.type === "error"
            ? "bg-red-500"
            : toast.type === "info"
              ? "bg-blue-500"
              : "bg-emerald-500"
        }`}
        style={{
          animation: `gridmineToastProgress ${toast.duration}ms linear forwards`,
        }}
      />

      <style jsx>{`
        @keyframes gridmineToastProgress {
          from {
            width: 100%;
          }

          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}