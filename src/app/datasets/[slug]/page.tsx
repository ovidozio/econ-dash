import DatasetClient from "./DatasetClient";

type PageProps = {
  params: { slug: string };
};

export default function Page({ params: { slug } }: PageProps) {
  return <DatasetClient slug={slug} />;
}

