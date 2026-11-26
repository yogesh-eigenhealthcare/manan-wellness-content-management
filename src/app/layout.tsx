import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manan Wellness Studio",
  description:
    "Two-gate content planning, production, and approval studio for Manan Wellness.",
};

const FOUC_SCRIPT = `try{var s=localStorage.getItem("color-scheme");var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(s==="light"||s==="dark"){document.querySelector('meta[name="color-scheme"]').setAttribute("content",s);}if(d){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={plusJakarta.variable}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ContentProvider>{children}</ContentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
