import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Solidarity Forum",
  description: "Anonymous community forum. No email required. No tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider />
        <Navigation />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
