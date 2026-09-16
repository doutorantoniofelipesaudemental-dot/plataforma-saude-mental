import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "./Header";

// Mesmas familias tipograficas do site principal (Regra 7 do CLAUDE.md —
// DNA de marca consolidado, nao uma escolha nova para esta app).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Plataforma Integrada de Saúde Mental",
    template: "%s · Plataforma Integrada de Saúde Mental",
  },
  description:
    "Ferramentas clínicas do Dr. Antônio Felipe para APS, Pronto Atendimento Psiquiátrico, Saúde Ocupacional e Escola.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        {children}
      </body>
    </html>
  );
}
