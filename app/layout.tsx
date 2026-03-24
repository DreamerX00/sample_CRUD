import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Align",
  description: "Beautiful auth and task sharing CRUD starter built with Next.js and Postgres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
