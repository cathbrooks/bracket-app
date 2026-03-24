import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LayoutProvider } from "@/components/LayoutProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bracket App",
  description:
    "Create and manage tournament brackets with real-time updates and spectator views.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <LayoutProvider>{children}</LayoutProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
