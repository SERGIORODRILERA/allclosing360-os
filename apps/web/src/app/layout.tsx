import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALLCLOSING360 OS — Executive Command Center",
  description: "Sistema Operativo Empresarial Autónomo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
