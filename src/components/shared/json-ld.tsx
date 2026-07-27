interface JsonLdProps {
  data: object;
}

/**
 * Emits a JSON-LD structured-data script tag. Rendered from server
 * components so search engines and answer engines see it in the initial
 * HTML response.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
