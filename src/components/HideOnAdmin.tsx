"use client";

import { usePathname } from "next/navigation";

/** Public site chrome (footer) is not rendered inside the admin CMS. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : <>{children}</>;
}
