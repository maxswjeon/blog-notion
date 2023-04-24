import { Metadata, ResolvingMetadata } from "next";

export type LayoutProps = {
  children: React.ReactNode;
};

export type GenerateMetadataProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export type GenerateMetadata = (
  props: GenerateMetadataProps,
  parent: ResolvingMetadata
) => Promise<Metadata>;
