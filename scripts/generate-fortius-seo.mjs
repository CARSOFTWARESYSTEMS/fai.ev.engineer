/**
 * Post-build script: generates route-specific HTML files for all Fortius pages.
 *
 * After `vite build`, dist/index.html has the correct hashed asset paths but
 * FAI Engineer's default meta tags. This script copies it for each Fortius
 * route and injects the correct title, description, OG, canonical, and JSON-LD
 * so static crawlers (Google, social media scrapers) see Fortius-specific SEO.
 *
 * Vercel serves static files before applying rewrites, so dist/Fortius/index.html
 * takes priority over the catch-all rewrite rule — no vercel.json changes needed.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')

const SITE = 'https://fai.ev.engineer'
const ORG_NAME = 'Fortius Machining Solutions Private Limited'
const ORG_SHORT = 'Fortius Machining Solutions'

// ─── Route definitions ────────────────────────────────────────────────────────

const routes = [
  {
    dir: 'Fortius',
    title: `${ORG_NAME} | Precision CNC Machining Bengaluru`,
    description:
      'Fortius Machining Solutions Private Limited — precision CNC machining, milling, turning, jigs, fixtures, and press tools for automotive, aerospace, power electronics, and industrial applications. Peenya, Bengaluru.',
    keywords:
      'CNC machining Bengaluru, Fortius Machining Solutions, precision machining India, CNC milling, CNC turning, jigs and fixtures, press tools, aerospace components, automotive components, manufacturing Bengaluru',
    canonical: `${SITE}/Fortius`,
    schema: {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'LocalBusiness', 'ManufacturingBusiness'],
      name: ORG_NAME,
      alternateName: ORG_SHORT,
      url: `${SITE}/Fortius`,
      telephone: '+918880423666',
      email: 'vnyk.hgde@gmail.com',
      foundingDate: '2017',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Doddanna Industrial Estate, Peenya',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        postalCode: '560058',
        addressCountry: 'IN',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 13.1029875, longitude: 77.5018281 },
      description:
        'Precision CNC machining, milling, turning, jigs, fixtures, press tools, and manufacturing solutions for automotive, aerospace, power electronics, and electrical industries.',
      areaServed: ['India', 'International'],
      knowsAbout: ['CNC Machining', 'CNC Milling', 'CNC Turning', 'Aerospace Components', 'Automotive Components', 'Jigs and Fixtures', 'Press Tools'],
    },
  },
  {
    dir: 'fortius/cnc-machining',
    title: `Precision CNC Machining Services in Bengaluru | ${ORG_SHORT}`,
    description:
      'Precision CNC machining services — CNC milling, turning, and component manufacturing for automotive, aerospace, power electronics, and industrial applications. Fortius, Peenya, Bengaluru.',
    keywords:
      'CNC machining Bengaluru, precision machining India, CNC machining services Bangalore, CNC component manufacturing, precision machined parts India, CNC machining automotive, CNC machining aerospace',
    canonical: `${SITE}/fortius/cnc-machining`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'CNC Machining',
      description: 'Precision CNC machining services for automotive, aerospace, power electronics, and industrial applications.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/cnc-machining`,
    },
  },
  {
    dir: 'fortius/cnc-milling',
    title: `CNC Milling Services | Precision Milled Components | ${ORG_SHORT}`,
    description:
      'Precision CNC milling services at Fortius Machining Solutions, Bengaluru. Multi-axis milling for complex geometries, pockets, slots, and contoured surfaces for automotive, aerospace, and industrial applications.',
    keywords:
      'CNC milling services, CNC milling Bengaluru, precision milling India, CNC milled components, multi-axis milling, CNC milling automotive, CNC milling aerospace',
    canonical: `${SITE}/fortius/cnc-milling`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'CNC Milling',
      description: 'Precision multi-axis CNC milling services for complex geometries, pockets, slots, and contoured surfaces.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/cnc-milling`,
    },
  },
  {
    dir: 'fortius/cnc-turning',
    title: `CNC Turning Services | Precision Turned Components | ${ORG_SHORT}`,
    description:
      'Precision CNC turning services at Fortius Machining Solutions, Bengaluru. High-accuracy turning for shafts, bushings, flanges, and rotational components in steel, aluminium, and engineering metals.',
    keywords:
      'CNC turning services, CNC turned components, precision turning India, CNC turning Bengaluru, turned parts manufacturer, CNC shaft turning, precision turned parts',
    canonical: `${SITE}/fortius/cnc-turning`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'CNC Turning',
      description: 'Precision CNC turning services for shafts, bushings, flanges, and all rotational components.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/cnc-turning`,
    },
  },
  {
    dir: 'fortius/aerospace-components',
    title: `Aerospace Component Manufacturing | ${ORG_SHORT} Bengaluru`,
    description:
      'Precision aerospace component manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined aerospace structural parts, brackets, jigs, and fixtures for aerospace manufacturing programs.',
    keywords:
      'aerospace component manufacturing India, aerospace machining Bengaluru, aerospace components manufacturer, precision aerospace parts India, aerospace CNC machining, aerospace jigs and fixtures',
    canonical: `${SITE}/fortius/aerospace-components`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Aerospace Component Manufacturing',
      description: 'Precision CNC machined components for aerospace structural and mechanical applications.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/aerospace-components`,
    },
  },
  {
    dir: 'fortius/automotive-components',
    title: `Automotive Component Manufacturing | ${ORG_SHORT} Bengaluru`,
    description:
      'Precision automotive component manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined automotive and EV components for OEMs and Tier 1/2 suppliers.',
    keywords:
      'automotive component manufacturer India, automotive machining Bengaluru, CNC automotive parts India, EV automotive components, automotive precision machining, Tier 1 automotive supplier India',
    canonical: `${SITE}/fortius/automotive-components`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Automotive Component Manufacturing',
      description: 'Precision machined components for automotive OEMs, EV programs, and Tier 1/2 suppliers.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/automotive-components`,
    },
  },
  {
    dir: 'fortius/jigs-and-fixtures',
    title: `Jigs and Fixtures Manufacturing | ${ORG_SHORT} Bengaluru`,
    description:
      'Precision jigs and fixtures manufacturing at Fortius Machining Solutions, Bengaluru. Custom jig bodies, fixture plates, assembly jigs, and inspection fixtures for automotive, aerospace, and industrial manufacturing.',
    keywords:
      'jigs and fixtures manufacturer India, jig manufacturer Bengaluru, fixtures manufacturer India, inspection fixtures manufacturer, assembly jigs India, precision fixtures manufacturing',
    canonical: `${SITE}/fortius/jigs-and-fixtures`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Jigs and Fixtures Manufacturing',
      description: 'Custom jig and fixture manufacturing for production accuracy, assembly, and inspection operations.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/jigs-and-fixtures`,
    },
  },
  {
    dir: 'fortius/press-tools',
    title: `Press Tool Manufacturing Services | ${ORG_SHORT} Bengaluru`,
    description:
      'Precision press tool manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined blanking tools, forming dies, progressive dies, and sheet metal tooling for automotive, electrical, and industrial applications.',
    keywords:
      'press tool manufacturer India, press tool manufacturing Bengaluru, sheet metal tooling India, die manufacturing India, blanking tool manufacturer, forming die manufacturer, progressive die manufacturer India',
    canonical: `${SITE}/fortius/press-tools`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Press Tool Manufacturing',
      description: 'Precision press tool manufacture: blanking dies, forming tools, compound dies, and progressive die tooling for sheet metal operations.',
      provider: { '@type': 'Organization', name: ORG_NAME, url: `${SITE}/Fortius`, telephone: '+918880423666' },
      areaServed: ['India', 'Global'],
      url: `${SITE}/fortius/press-tools`,
    },
  },
]

// ─── HTML injection ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function injectSEO(html, route) {
  const { title, description, keywords, canonical, schema } = route

  let out = html

  // title
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)

  // meta description
  out = out.replace(
    /<meta name="description" content="[^"]*"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  )

  // meta keywords
  out = out.replace(
    /<meta name="keywords" content="[^"]*"[^>]*>/,
    `<meta name="keywords" content="${escapeHtml(keywords)}" />`
  )

  // canonical
  out = out.replace(
    /<link rel="canonical" href="[^"]*"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  )

  // og:url
  out = out.replace(
    /<meta property="og:url" content="[^"]*"[^>]*>/,
    `<meta property="og:url" content="${canonical}" />`
  )

  // og:site_name
  out = out.replace(
    /<meta property="og:site_name" content="[^"]*"[^>]*>/,
    `<meta property="og:site_name" content="${escapeHtml(ORG_SHORT)}" />`
  )

  // og:title
  out = out.replace(
    /<meta property="og:title" content="[^"]*"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  )

  // og:description
  out = out.replace(
    /<meta property="og:description" content="[^"]*"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  )

  // twitter:title
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  )

  // twitter:description
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  )

  // JSON-LD: replace the entire existing script block
  out = out.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n    ${JSON.stringify(schema, null, 2)}\n    </script>`
  )

  return out
}

// ─── Generate files ───────────────────────────────────────────────────────────

let count = 0
for (const route of routes) {
  const outDir = path.join(distDir, route.dir)
  fs.mkdirSync(outDir, { recursive: true })
  const html = injectSEO(baseHtml, route)
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`  ✓ /${route.dir}`)
  count++
}

console.log(`\nFortius SEO: generated ${count} route-specific HTML files.`)
