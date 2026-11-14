import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finpal — money, in perspective",
  description:
    "A calm, clear home for your budgets, investments, and long-term plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
