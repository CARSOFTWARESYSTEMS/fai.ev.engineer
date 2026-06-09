// Centralized GA4 analytics service.
// All event tracking must go through this service — never call gtag() directly from components.

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const FORTIUS_PARTNER = 'Fortius Machining Solutions Private Limited'

function track(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, {
    page_path: window.location.pathname,
    page_title: document.title,
    ...params,
  })
}

// ─── Page views ───────────────────────────────────────────────────────────────

export function trackPageView(pageName: string, pagePath?: string) {
  track('page_view', {
    page_name: pageName,
    page_path: pagePath ?? window.location.pathname,
  })
}

// ─── CTAs ─────────────────────────────────────────────────────────────────────

export function trackCTA(buttonName: string, sectionName?: string) {
  track('cta_click', { button_name: buttonName, section_name: sectionName })
}

// ─── Fortius partner page ─────────────────────────────────────────────────────

export function trackFortiusPageView() {
  track('fortius_page_view', {
    partner_name: FORTIUS_PARTNER,
    page_path: '/Fortius',
  })
}

export function trackFortiusFooterLink(linkName: string, sectionName: string) {
  track('fortius_footer_link_click', {
    link_name: linkName,
    section_name: sectionName,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFooterCTA(ctaName: string) {
  track('fortius_footer_cta_click', {
    cta_name: ctaName,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusCall() {
  track('fortius_call_click', { partner_name: FORTIUS_PARTNER })
}

export function trackFortiusEmail() {
  track('fortius_email_click', { partner_name: FORTIUS_PARTNER })
}

export function trackFortiusRequestQuote() {
  track('fortius_request_quote_click', { partner_name: FORTIUS_PARTNER })
}

export function trackFortiusSectionNav(sectionName: string) {
  track('fortius_section_navigation_click', {
    section_name: sectionName,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Fortius × FAI Toolkit highlight section ──────────────────────────────────

export function trackFortiusFAIToolkitSectionView() {
  track('fortius_fai_toolkit_section_view', {
    page_path: '/Fortius',
    section_name: 'FAI Toolkit Highlight',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFAIToolkitCTAClick() {
  track('fortius_fai_toolkit_cta_click', {
    page_path: '/Fortius',
    section_name: 'FAI Toolkit Highlight',
    cta_name: 'Explore FAI.EV.ENGINEER Toolkit',
    destination_url: 'https://fai.ev.engineer/',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Fortius service sub-pages ────────────────────────────────────────────────

export function trackFortiusServicePageView(serviceName: string, pagePath: string) {
  track('fortius_service_page_view', {
    service_name: serviceName,
    page_path: pagePath,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusServiceCTAClick(serviceName: string, ctaName: string) {
  track('fortius_service_cta_click', {
    service_name: serviceName,
    cta_name: ctaName,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFAQExpand(question: string) {
  track('fortius_faq_expand', {
    faq_question: question,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusIndustrySectionView(industryName: string) {
  track('fortius_industry_section_view', {
    industry_name: industryName,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusRelatedServiceClick(serviceName: string) {
  track('fortius_related_service_click', {
    service_name: serviceName,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Fortius floating CTA buttons ────────────────────────────────────────────

export function trackFortiusDirectionsClick(source: 'footer' | 'floating') {
  track('fortius_directions_click', {
    page_path: '/Fortius',
    cta_name: 'Directions',
    source,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFloatingCallClick() {
  track('fortius_floating_call_click', {
    page_path: '/Fortius',
    cta_name: 'Call Now',
    cta_position: 'floating_bottom_left',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFloatingWhatsAppClick() {
  track('fortius_floating_whatsapp_click', {
    page_path: '/Fortius',
    cta_name: 'WhatsApp',
    cta_position: 'floating_bottom_right',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFAISupportContactClick() {
  track('fortius_fai_support_contact_click', {
    page_path: '/Fortius',
    section_name: 'FAI Toolkit Highlight',
    cta_name: 'Contact Fortius for FAI Support',
    partner_name: FORTIUS_PARTNER,
  })
}
