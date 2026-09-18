import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";
import "./globals.css";

const fuenteDisplay = Plus_Jakarta_Sans({
  variable: "--fuente-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const fuenteTexto = Work_Sans({
  variable: "--fuente-texto",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BaldeCash | Solicitudes de financiamiento",
  description:
    "Solicita el financiamiento de tu laptop y sigue el estado de tu solicitud.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${fuenteDisplay.variable} ${fuenteTexto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
