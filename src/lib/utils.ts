import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined, fmt = "dd MMM yyyy") {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: string | number | undefined) {
  if (amount === undefined || amount === null) return "KES 0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `KES ${num.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      const val = data[firstKey];
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
      if (typeof val === "string") return `${firstKey}: ${val}`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  available: "bg-emerald-100 text-emerald-800",
  on_job: "bg-blue-100 text-blue-800",
  maintenance: "bg-orange-100 text-orange-800",
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  waived: "bg-gray-100 text-gray-600",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  available: "Available",
  on_job: "On Job",
  maintenance: "Maintenance",
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  waived: "Waived",
  studio: "Studio",
  one_bedroom: "1 Bedroom",
  two_bedroom: "2 Bedrooms",
  three_bedroom: "3 Bedrooms",
  office_small: "Office (Small)",
  office_large: "Office (Large)",
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
};

export function getRatingColor(rating: number) {
  if (rating >= 4.5) return "text-emerald-600";
  if (rating >= 3.5) return "text-blue-600";
  if (rating >= 2.5) return "text-amber-600";
  return "text-red-600";
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}
