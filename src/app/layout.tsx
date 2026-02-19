import type { Metadata } from "next";
import "./globals.css";
import "./components.css";

export const metadata: Metadata = {
  title: "PlanPilot — Intelligente Unterrichtsplanung",
  description: "PlanPilot hilft Lehrpersonen, Unterricht schneller und didaktisch besser zu planen. KI-gestützte Planung mit Differenzierung, Lehrplan-Mapping und Export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}
