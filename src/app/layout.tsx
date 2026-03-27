import type { Metadata } from "next";
import { ConditionalNav } from "@/components/layout/ConditionalNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Workflow — EU Open Source Fund",
  description: "Privacy-first grant review workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConditionalNav />
        {children}
      </body>
    </html>
  );
}
