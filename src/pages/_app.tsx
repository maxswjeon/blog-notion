import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";

import { DefaultLayout } from "layouts/DefaultLayout";
import { LayoutComponent } from "types/layout";

import "styles/globals.css";

import "react-notion-x/src/styles.css";

import "katex/dist/katex.min.css";
import "prismjs/themes/prism-tomorrow.css";

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
      <Analytics />
    </Layout>
  );
}
