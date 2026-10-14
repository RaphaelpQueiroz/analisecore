export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import AppShell from "./components/AppShell";
import { AuthProvider } from "./contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Análises Core - Inteligência Comercial",
  description: "Plataforma Executiva de Inteligência Comercial e Varejo Supermercadista",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div id="root-portal"></div>
        <AuthProvider>
          <AppShell>
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
