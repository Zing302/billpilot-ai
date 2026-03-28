import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BillPilot AI",
  description: "Healthcare cost clarity before care and after the bill lands.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
