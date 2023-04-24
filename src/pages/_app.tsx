import { DefaultLayout } from "layouts/DefaultLayout";
import type { AppProps } from "next/app";
import "styles/globals.css";
import { LayoutComponent } from "types/layout";

// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

// used for code syntax highlighting (optional)
import "prismjs/themes/prism-tomorrow.css";

// used for rendering equations (optional)
import "katex/dist/katex.min.css";

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
