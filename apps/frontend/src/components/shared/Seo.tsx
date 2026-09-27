type SeoProps = {
  title: string;
  noindex?: boolean;
};

export default function Seo({ title, noindex = false }: SeoProps) {
  return (
    <>
      <title>{title}</title>
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
}
