import type { Metadata } from "next";
import { Concert_One, Manrope, Karla } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutProvider } from "@/components/layout-context";
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'

const concertOne = Concert_One({
  variable: "--font-concert",
  subsets: ["latin"],
  weight: ["400"],
});

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const karla = Karla({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FOMO Dashboard",
  description: "Dashboard integral de e-commerce con análisis avanzado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${concertOne.variable} ${manrope.variable} ${karla.variable} antialiased font-body ${GeistSans.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
