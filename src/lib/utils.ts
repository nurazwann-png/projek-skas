import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getLevelLabel(level: string) {
  const labels: Record<string, string> = {
    district: "Daerah",
    state: "Negeri",
    national: "Kebangsaan",
    international: "Antarabangsa",
  };
  return labels[level] ?? level;
}

export function getTeacherRoleLabel(role: string) {
  const labels: Record<string, string> = {
    peserta: "Peserta",
    jurulatih: "Jurulatih",
    penganjur: "Penganjur",
    fasilitator: "Fasilitator",
    hakim: "Hakim",
  };
  return labels[role] ?? role;
}
