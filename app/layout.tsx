import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers"; // Import the Providers
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Inbox Insight AI",
  description: "Your Gmail Inbox, Organized and Summarized by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-[#23243a] via-[#121325] to-[#0c0c18] min-h-screen`}>
        <Providers>
          {children}
          <Toaster/>
        </Providers>
      </body>
    </html>
  );
}
