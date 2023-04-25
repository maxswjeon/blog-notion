import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";

import { DefaultLayout } from "layouts/DefaultLayout";
import { LayoutComponent } from "types/layout";

import "styles/globals.css";

import "react-notion-x/src/styles.css";

import "katex/dist/katex.min.css";
import Script from "next/script";
import "prismjs/themes/prism-tomorrow.css";

type LayoutAppProps = {
  Component: {
    Layout?: LayoutComponent;
  };
} & AppProps;

export default function App({ Component, pageProps }: LayoutAppProps) {
  const Layout = Component.Layout || DefaultLayout;

  return (
    <>
      {process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID}');
            `}
          </Script>
        </>
      )}
      <Layout>
        <Component {...pageProps} />
        <Analytics />
      </Layout>
    </>
  );
}
