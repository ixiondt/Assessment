import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number | null): string {
  switch (score) {
    case 1: return "bg-red-500 text-white";
    case 2: return "bg-orange-500 text-white";
    case 3: return "bg-yellow-500 text-black";
    case 4: return "bg-green-500 text-white";
    case 5: return "bg-blue-500 text-white";
    default: return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
}

export function riskRating(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Critical", color: "bg-red-700 text-white" };
  if (score >= 50) return { label: "High", color: "bg-red-500 text-white" };
  if (score >= 25) return { label: "Medium", color: "bg-yellow-500 text-black" };
  if (score >= 10) return { label: "Low", color: "bg-green-500 text-white" };
  return { label: "Minimal", color: "bg-blue-500 text-white" };
}

export function riskRatingFromScore(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  if (score >= 10) return "low";
  return "minimal";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusColor(status: string): string {
  switch (status) {
    case "draft": return "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    case "in_progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "completed": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default: return "bg-gray-200 text-gray-700";
  }
}
