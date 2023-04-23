import { LayoutProps } from "types/next";

import { Footer } from "components/Footer";
import { Header } from "components/Header";

import { Shortcut } from "components/Shortcut";
import "normalize.css";
import "styles/globals.css";

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ko-KR">
      <body>
        <Shortcut />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
