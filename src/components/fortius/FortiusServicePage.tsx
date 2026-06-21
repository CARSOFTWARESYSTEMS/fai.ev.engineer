import { useEffect } from 'react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, ExternalLink, ArrowRight, CheckCircle } from 'lucide-react'
import { FortiusHeader } from '../layout/FortiusHeader'
import { FortiusFooter } from '../layout/FortiusFooter'
import { FortiusBreadcrumb } from './FortiusBreadcrumb'
import { FortiusFAQ } from './FortiusFAQ'
import { FortiusFloatingCTAs } from './FortiusFloatingCTAs'
import {
  trackFortiusServicePageView,
  trackFortiusServiceCTAClick,
  trackFortiusRelatedServiceClick,
} from '../../services/AnalyticsService'
import { buildMailtoLink } from '../../lib/contactMessage'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FortiusService {
  slug: string
  name: string
  title: string
  description: string
  keywords: string[]
  badge: string
  hero: { heading: string; subheading: string }
  ctaText: string
  ctaEmailSubject: string
  whatIs: { definition: string; importance: string }
  applications: string[]
  highlights: { Icon: ComponentType<{ className?: string }>; title: string; desc: string }[]
  industriesUsed: { name: string; desc: string }[]
  whyFortius: string[]
  faqs: { q: string; a: string }[]
  relatedServices: { name: string; href: string; desc: string }[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FortiusServicePage({ service }: { service: FortiusService }) {
  const canonical = `https://fai.ev.engineer/fortius/${service.slug}`

  useEffect(() => {
    window.scrollTo(0, 0)

    // Track page view
    trackFortiusServicePageView(service.name, `/fortius/${service.slug}`)

    // Meta / SEO
    const prevTitle = document.title
    document.title = service.title

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el) }
      el.content = content
      return el
    }
    const setProp = (prop: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.content = content
      return el
    }
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el) }
      el.href = href
      return el
    }

    const descEl   = setMeta('description', service.description)
    const kwEl     = setMeta('keywords', service.keywords.join(', '))
    const canEl    = setLink('canonical', canonical)
    const ogTitleEl = setProp('og:title', service.title)
    const ogDescEl  = setProp('og:description', service.description)
    const ogUrlEl   = setProp('og:url', canonical)
    const twTitleEl = setMeta('twitter:title', service.title)
    const twDescEl  = setMeta('twitter:description', service.description)

    // JSON-LD
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          name: service.name,
          description: service.description,
          provider: {
            '@type': 'Organization',
            name: 'Fortius Machining Solutions Private Limited',
            url: 'https://fai.ev.engineer/Fortius',
            telephone: '+918880423666',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Sy no. 35, Near Over Head Water Tank, Kempapura, Chikkabanavara',
              addressLocality: 'Bengaluru',
              addressRegion: 'Karnataka',
              postalCode: '560090',
              addressCountry: 'IN',
            },
          },
          areaServed: ['India', 'Global'],
          serviceType: service.name,
          url: canonical,
        },
        {
          '@type': 'FAQPage',
          mainEntity: service.faqs.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fai.ev.engineer/' },
            { '@type': 'ListItem', position: 2, name: 'Fortius Machining Solutions', item: 'https://fai.ev.engineer/Fortius' },
            { '@type': 'ListItem', position: 3, name: service.name, item: canonical },
          ],
        },
      ],
    }
    let ldScript = document.getElementById('fortius-service-schema') as HTMLScriptElement | null
    if (!ldScript) {
      ldScript = document.createElement('script')
      ldScript.id = 'fortius-service-schema'
      ldScript.type = 'application/ld+json'
      document.head.appendChild(ldScript)
    }
    ldScript.textContent = JSON.stringify(schema)

    return () => {
      document.title = prevTitle
      descEl.content = ''
      kwEl.content = ''
      canEl.href = 'https://fai.ev.engineer/'
      ogTitleEl.content = ''
      ogDescEl.content = ''
      ogUrlEl.content = ''
      twTitleEl.content = ''
      twDescEl.content = ''
      ldScript?.remove()
    }
  }, [service, canonical])

  const mailtoHref = buildMailtoLink('vnyk.hgde@gmail.com', service.ctaEmailSubject, {
    partnerName: 'Fortius Machining Solutions',
    issue: `I am interested in ${service.name}.`,
  })

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <FortiusHeader />

      {/* Breadcrumb */}
      <FortiusBreadcrumb
        crumbs={[
          { label: 'Fortius Machining Solutions', href: '/Fortius' },
          { label: service.name },
        ]}
      />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-primary-light via-white to-white pt-14 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                {service.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight tracking-tight mb-5">
                {service.hero.heading}
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-3xl">
                {service.hero.subheading}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={mailtoHref}
                  onClick={() => trackFortiusServiceCTAClick(service.name, service.ctaText)}
                  className="btn-primary text-base px-8 py-4 w-full sm:w-auto text-center"
                >
                  {service.ctaText}
                </a>
                <Link
                  to="/Fortius#contact"
                  className="btn-secondary text-base px-8 py-4 w-full sm:w-auto text-center"
                >
                  Contact Fortius
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── What Is + Why Important ───────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  What Is {service.name}?
                </h2>
                <p className="text-text-secondary leading-relaxed text-base">
                  {service.whatIs.definition}
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Why Is It Important?
                </h2>
                <p className="text-text-secondary leading-relaxed text-base">
                  {service.whatIs.importance}
                </p>
              </div>
            </div>

            {/* Applications */}
            <div className="mt-14">
              <h3 className="text-lg font-bold text-text-primary mb-5">Typical Applications</h3>
              <div className="flex flex-wrap gap-2.5">
                {service.applications.map((app) => (
                  <span
                    key={app}
                    className="px-4 py-2 bg-primary-light text-primary text-sm font-medium rounded-full border border-primary/20"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Capability Highlights ─────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title">{service.name} Capabilities at Fortius</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Precision manufacturing delivered with engineering discipline and quality focus.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.highlights.map(({ Icon, title, desc }) => (
                <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Industries Using This Service ─────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title">Industries Using This Service</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                {service.name} serves a wide range of manufacturing sectors.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.industriesUsed.map(({ name, desc }) => (
                <div key={name} className="card p-6 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-text-primary mb-2">{name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Fortius ───────────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="section-title text-left mb-6">
                  Why Choose Fortius for {service.name}?
                </h2>
                <ul className="space-y-3">
                  {service.whyFortius.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-text-secondary">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-8 bg-gradient-to-br from-[#EBF3FF] to-white border border-primary/20">
                <p className="text-sm text-text-secondary mb-1">Ready to discuss your project?</p>
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  Get a manufacturing quote from Fortius
                </h3>
                <div className="flex flex-col gap-3">
                  <a
                    href={mailtoHref}
                    onClick={() => trackFortiusServiceCTAClick(service.name, service.ctaText)}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {service.ctaText}
                  </a>
                  <a
                    href="tel:+918880423666"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 border border-primary/30 text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call +91 88804 23666
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                Common questions about {service.name} at Fortius Machining Solutions.
              </p>
            </div>
            <FortiusFAQ faqs={service.faqs} />
          </div>
        </section>

        {/* ── Related Services ──────────────────────────────────────────────── */}
        {service.relatedServices.length > 0 && (
          <section className="py-20 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="section-title">Related Services</h2>
                <p className="section-subtitle max-w-xl mx-auto">
                  Explore other manufacturing capabilities at Fortius.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {service.relatedServices.map(({ name, href, desc }) => (
                  <Link
                    key={name}
                    to={href}
                    onClick={() => trackFortiusRelatedServiceClick(name)}
                    className="card p-6 hover:shadow-md transition-shadow group"
                  >
                    <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">{desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="section-title mb-4">Start Your {service.name} Project</h2>
            <p className="section-subtitle mb-8">
              Share your drawing or requirement with Fortius. Our team will review and respond promptly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={mailtoHref}
                onClick={() => trackFortiusServiceCTAClick(service.name, service.ctaText)}
                className="btn-primary text-base px-10 py-4 w-full sm:w-auto"
              >
                {service.ctaText}
              </a>
              <Link
                to="/Fortius"
                className="btn-secondary text-base px-10 py-4 w-full sm:w-auto text-center"
              >
                <ExternalLink className="w-4 h-4" />
                Back to Fortius
              </Link>
            </div>
          </div>
        </section>

      </main>

      <FortiusFooter />
      <FortiusFloatingCTAs />
    </div>
  )
}
