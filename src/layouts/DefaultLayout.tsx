import { Footer } from "components/Footer";
import { Header } from "components/Header";
import { Shortcut } from "components/Shortcut";
import { LayoutProps } from "types/layout";

export function DefaultLayout({ children }: LayoutProps) {
  return (
    <>
      <Shortcut />
      <Header />
      {children}
      <Footer />
    </>
  );
}
