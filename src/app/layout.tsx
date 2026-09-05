import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Gridmine CRM",
  description: "Internal CRM for Gridmine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme =
                    localStorage.getItem("gridmine-theme") || "system";

                  var isDark =
                    theme === "dark" ||
                    (theme === "system" &&
                      window.matchMedia("(prefers-color-scheme: dark)").matches);

                  document.documentElement.classList.toggle("dark", isDark);
                  document.documentElement.dataset.theme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-full text-[13.5px] text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}