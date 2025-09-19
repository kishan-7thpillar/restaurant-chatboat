import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: "Restaurant AI Assistant",
  description: "AI-powered restaurant management assistant with POS, scheduling, and financial insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider
          defaultTheme="system"
          storageKey="restaurant-ai-theme"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
