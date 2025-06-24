import "./globals.css";
import type { ReactNode } from "react";
import SessionProviderClient from "./components/SessionProviderClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderClient>{children}</SessionProviderClient>
      </body>
    </html>
  );
}
