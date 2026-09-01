import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Gridmine CRM",
  description: "Internal CRM for Gridmine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full text-[13.5px] text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
