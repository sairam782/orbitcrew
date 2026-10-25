import type { Metadata } from "next";
import "./globals.css";
import "./adventure.css";
export const metadata: Metadata = {
  title: "Orbit Crew · Beyond the last lighthouse",
  description: "A cooperative space adventure with branching routes, shared relay puzzles, specialist abilities, and a place for every player.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
