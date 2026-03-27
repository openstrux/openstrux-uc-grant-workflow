"use client";

import { usePathname } from "next/navigation";
import { PublicNav } from "./PublicNav";

export function ConditionalNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <PublicNav />;
}
