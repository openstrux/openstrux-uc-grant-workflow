import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Workflow",
  description: "Privacy-first grant review workflow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Dashboard</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/results">Results</Link>
        </nav>
        {children}
        <footer>
          <p>Grant Workflow — Privacy-first review system</p>
        </footer>
      </body>
    </html>
  );
}
