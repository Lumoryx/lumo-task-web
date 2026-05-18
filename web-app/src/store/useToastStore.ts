import { create } from "zustand";

export type ToastType = "error" | "success" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number; // ms, 0 = persistent
}

export type ToastInput = Omit<Toast, "id" | "duration"> & { duration?: number };

interface ToastStore {
  toasts: Toast[];
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let _seq = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push: (toast: ToastInput) => {
    const id = `toast-${++_seq}`;
    const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id, duration }] }));
    return id;
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

// Convenience helpers — call from anywhere without hooks
export const toast = {
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ type: "error", title, message }),
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ type: "success", title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().push({ type: "warning", title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().push({ type: "info", title, message }),
};
