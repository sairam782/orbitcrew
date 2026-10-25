import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Orbit Crew · A little space for everyone",
  description: "An accessible cooperative space rescue. Join your crew, choose your next move, and bring everyone home. Play at your own pace.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
