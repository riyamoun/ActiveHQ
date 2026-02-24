import { Helmet } from 'react-helmet-async'

type SchemaObject = Record<string, unknown>

interface SeoMetaProps {
  title: string
  description: string
  path: string
  image?: string
  schemas?: SchemaObject[]
}

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://active-hq-git-main-riyamouns-projects.vercel.app'
const DEFAULT_IMAGE = `${BASE_URL}/favicon.svg`

export function SeoMeta({ title, description, path, image, schemas = [] }: SeoMetaProps) {
  const canonical = `${BASE_URL}${path}`
  const ogImage = image ?? DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}
