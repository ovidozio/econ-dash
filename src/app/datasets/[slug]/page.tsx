import DatasetClient from "./DatasetClient";

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <DatasetClient slug={slug} />;
}

