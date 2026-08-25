import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaySlip Studio — Free Online Payslip Editor & Generator",
  description: "Create, edit, customize, and export professional payslips for free with live split-screen preview, dynamic calculation, custom templates, and QR verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Courier+Prime:wght@400;700&family=Fira+Code:wght@400;600&family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@500;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
