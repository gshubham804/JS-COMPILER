import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, type UserConfig } from 'vite'

const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

function pickVite(
  key: 'VITE_PUBLIC_SITE_URL' | 'VITE_GOOGLE_SITE_VERIFICATION',
  fileEnv: Record<string, string>
): string | undefined {
  return process.env[key] ?? fileEnv[key]
}

function jscSeoBuildPlugin(
  fileEnv: Record<string, string>
): Plugin {
  return {
    name: 'jsc-seo-assets',
    transformIndexHtml(html: string) {
      const siteUrl = (
        pickVite('VITE_PUBLIC_SITE_URL', fileEnv) || 'http://localhost:5173'
      ).replace(/\/+$/, '')
      let h = html.replaceAll('__SITE_URL__', siteUrl)
      const gsv = pickVite('VITE_GOOGLE_SITE_VERIFICATION', fileEnv)?.trim()
      if (gsv) {
        h = h.replace(
          '</head>',
          `<meta name="google-site-verification" content="${escapeXml(gsv)}" />\n  </head>`
        )
      }
      return h
    },
    writeBundle(options) {
      const outDir = options.dir
        ? resolve(String(options.dir))
        : resolve(process.cwd(), 'dist')
      const siteUrl = (
        pickVite('VITE_PUBLIC_SITE_URL', fileEnv) || 'http://localhost:5173'
      ).replace(/\/+$/, '')
      const lastmod = new Date().toISOString().slice(0, 10)
      const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(siteUrl)}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`
      writeFileSync(resolve(outDir, 'robots.txt'), robots, 'utf8')
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap, 'utf8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_') as Record<
    string,
    string
  >
  return {
    envPrefix: ['VITE_'],
    plugins: [react(), tailwindcss(), jscSeoBuildPlugin(fileEnv)],
  }
})
