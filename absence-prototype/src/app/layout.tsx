import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "../providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Kontek Lön - Avvikelseapp",
  description: "Prototyp för hantering av frånvaro och avvikelser med PAXML-integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
