import { DefaultLayout } from "layouts/DefaultLayout";
import type { AppProps } from "next/app";
import "styles/globals.css";
import { LayoutComponent } from "types/layout";

type LayoutAppProps = {
  Component: {
    Layout?: LayoutComponent;
  };
} & AppProps;

export default function App({ Component, pageProps }: LayoutAppProps) {
  const Layout = Component.Layout || DefaultLayout;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
