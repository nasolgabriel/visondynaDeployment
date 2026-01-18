import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, chr) => sep + chr.toUpperCase());
}

export function getBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/$/, "");

  if (process.env.VERCEL_ENV === "production") {
    return process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
