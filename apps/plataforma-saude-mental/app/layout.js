import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "./Header";
import RodapeGeral from "./RodapeGeral";

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
    default: "Portal de Saúde Mental Doutor Antônio Felipe Garabito",
    template: "%s · Portal de Saúde Mental Doutor Antônio Felipe Garabito",
  },
  description:
    "Ferramentas clínicas do Dr. Antônio Felipe para APS, Pronto Atendimento Psiquiátrico, Saúde Ocupacional e Escola.",
  // Ambiente de teste interno (Opção A, 23/10/2026): fora do índice do Google.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
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
        <RodapeGeral />
      </body>
    </html>
  );
}
