// Centralized GA4 analytics service.
// All event tracking must go through this service — never call gtag() directly from components.

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

// ─── Event log (for debug page) ──────────────────────────────────────────────

export interface EventLogEntry {
  id: string
  eventName: string
  params: Record<string, unknown>
  timestamp: number
  pagePath: string
  pageTitle: string
}

const MAX_LOG = 100
const eventLog: EventLogEntry[] = []
const listeners = new Set<(entry: EventLogEntry) => void>()

export function getEventLog(): EventLogEntry[] {
  return [...eventLog]
}
export function subscribeToEvents(fn: (entry: EventLogEntry) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Session + device ─────────────────────────────────────────────────────────

export const SESSION_ID =
  (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('_fai_sid')) ||
  (() => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    typeof sessionStorage !== 'undefined' && sessionStorage.setItem('_fai_sid', id)
    return id
  })()

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

const FORTIUS_PARTNER = 'Fortius Machining Solutions Private Limited'

// ─── Core track function ──────────────────────────────────────────────────────

function track(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  const enriched: Record<string, unknown> = {
    page_path: window.location.pathname,
    page_title: document.title,
    session_id: SESSION_ID,
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    ...params,
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, enriched)
  }

  const entry: EventLogEntry = {
    id: Math.random().toString(36).slice(2),
    eventName,
    params: enriched,
    timestamp: Date.now(),
    pagePath: window.location.pathname,
    pageTitle: document.title,
  }
  eventLog.unshift(entry)
  if (eventLog.length > MAX_LOG) eventLog.pop()
  listeners.forEach((fn) => fn(entry))
}

// ─── Generic ──────────────────────────────────────────────────────────────────

export function trackPageView(pageName: string, pagePath?: string) {
  track('page_view', {
    page_name: pageName,
    page_path: pagePath ?? window.location.pathname,
  })
}

export function trackCTA(buttonName: string, sectionName?: string) {
  track('cta_click', { button_name: buttonName, section_name: sectionName })
}

// ─── Phase 1 — Page view ──────────────────────────────────────────────────────

export function trackFortiusPageView() {
  track('fortius_page_view', {
    page_path: '/Fortius',
    page_title: document.title,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 2 — Header menu ────────────────────────────────────────────────────

export function trackFortiusMenuClick(menuName: string) {
  track('fortius_menu_click', {
    menu_name: menuName,
    page_path: '/Fortius',
  })
}

// Kept for backward compat
export function trackFortiusSectionNav(sectionName: string) {
  track('fortius_section_navigation_click', {
    section_name: sectionName,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 3 — Hero CTAs ──────────────────────────────────────────────────────

export function trackFortiusHeroQuoteClick() {
  track('fortius_quote_click', {
    page_path: '/Fortius',
    section_name: 'Hero',
    cta_name: 'Request Manufacturing Quote',
  })
}

export function trackFortiusHeroCapabilitiesClick() {
  track('fortius_capabilities_click', {
    page_path: '/Fortius',
    section_name: 'Hero',
    cta_name: 'View Capabilities',
  })
}

// ─── Phase 4 — Contact actions ────────────────────────────────────────────────

export function trackFortiusCall(source = 'inline') {
  track('fortius_call_click', {
    phone_number: '+918880423666',
    page_path: window.location.pathname,
    source,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusEmail(source = 'inline') {
  track('fortius_email_click', {
    email_address: 'vnyk.hgde@gmail.com',
    page_path: window.location.pathname,
    source,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusWhatsAppClick(position = 'floating') {
  track('fortius_whatsapp_click', {
    phone_number: '+918880423666',
    page_path: window.location.pathname,
    position,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusDirectionsClick(source: 'footer' | 'floating') {
  track('fortius_direction_click', {
    location_name: 'Fortius Machining Solutions, Kempapura, Chikkabanavara, Bengaluru',
    page_path: '/Fortius',
    source,
    partner_name: FORTIUS_PARTNER,
  })
}

// Kept for backward compat (floating buttons use these)
export function trackFortiusFloatingCallClick() {
  track('fortius_floating_call_click', {
    phone_number: '+918880423666',
    page_path: '/Fortius',
    cta_name: 'Call Now',
    cta_position: 'floating_bottom_left',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFloatingWhatsAppClick() {
  track('fortius_floating_whatsapp_click', {
    phone_number: '+918880423666',
    page_path: '/Fortius',
    cta_name: 'WhatsApp',
    cta_position: 'floating_bottom_right',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 5 — Contact form ───────────────────────────────────────────────────

export function trackFortiusContactFormOpen() {
  track('fortius_contact_form_open', {
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusContactFormSubmit(name: string, company: string) {
  track('fortius_contact_form_submit', {
    page_path: '/Fortius',
    lead_name: name,
    lead_company: company,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusLeadGenerated(name: string, company: string, email: string) {
  track('fortius_lead_generated', {
    page_path: '/Fortius',
    lead_name: name,
    lead_company: company,
    lead_email: email,
    partner_name: FORTIUS_PARTNER,
    conversion: true,
  })
}

export function trackFortiusContactFormError(errorMessage: string) {
  track('fortius_contact_form_error', {
    page_path: '/Fortius',
    error_message: errorMessage,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 6 — Gallery ────────────────────────────────────────────────────────

export function trackFortiusGalleryView() {
  track('fortius_gallery_view', {
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusGalleryImageClick(imageName: string, index: number) {
  track('fortius_gallery_image_click', {
    image_name: imageName,
    image_index: index,
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusGalleryLightboxOpen(imageName: string, index: number) {
  track('fortius_gallery_lightbox_open', {
    image_name: imageName,
    image_index: index,
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 7 — Leadership ─────────────────────────────────────────────────────

export function trackFortiusFounderClick(founderName: string) {
  track('fortius_founder_click', {
    founder_name: founderName,
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusLinkedInClick(founderName: string) {
  track('fortius_linkedin_click', {
    founder_name: founderName,
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFounderPhoneClick(founderName: string) {
  track('fortius_founder_phone_click', {
    founder_name: founderName,
    phone_number: '+918880423666',
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFounderEmailClick(founderName: string) {
  track('fortius_founder_email_click', {
    founder_name: founderName,
    email_address: 'vnyk.hgde@gmail.com',
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 8 — Technology Partners ───────────────────────────────────────────

export function trackFortiusTechnologyPartnersView() {
  track('fortius_technology_partners_view', {
    page_path: '/Fortius',
    section_name: 'Technology Partners',
    partner_count: 2,
  })
}

export function trackFortiusPartnerClick(partnerName: string, destinationUrl: string) {
  track('fortius_partner_click', {
    partner_name: partnerName,
    destination_url: destinationUrl,
    page_path: '/Fortius',
  })
}

export function trackFortiusPartnerCTAClick(partnerName: string, destinationUrl: string) {
  track('fortius_partner_cta_click', {
    partner_name: partnerName,
    destination_url: destinationUrl,
    page_path: '/Fortius',
  })
}

export function trackFortiusExternalPartnerNavigation(destinationUrl: string, partnerName: string) {
  track('external_partner_navigation', {
    source_page: '/Fortius',
    destination_url: destinationUrl,
    partner_name: partnerName,
  })
}

// ─── Phase 9 — FAI Toolkit ────────────────────────────────────────────────────

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

export function trackFortiusFAISupportContactClick() {
  track('fortius_fai_support_contact_click', {
    page_path: '/Fortius',
    section_name: 'FAI Toolkit Highlight',
    cta_name: 'Contact Fortius for FAI Support',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 10 — Footer ────────────────────────────────────────────────────────

export function trackFortiusFooterPhoneClick() {
  track('fortius_footer_phone_click', {
    phone_number: '+918880423666',
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFooterEmailClick() {
  track('fortius_footer_email_click', {
    email_address: 'vnyk.hgde@gmail.com',
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFooterQuoteClick() {
  track('fortius_footer_quote_click', {
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFooterNavigationClick(linkName: string) {
  track('fortius_footer_navigation_click', {
    link_name: linkName,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

export function trackFortiusFooterPartnerClick(partnerName: string, destinationUrl: string) {
  track('fortius_footer_partner_click', {
    partner_name: partnerName,
    destination_url: destinationUrl,
    page_path: window.location.pathname,
  })
}

// Kept for backward compat
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

// ─── Phase 11 — Outbound links ────────────────────────────────────────────────

export function trackFortiusExternalLinkClick(destinationUrl: string, linkName: string) {
  track('fortius_external_link_click', {
    destination_url: destinationUrl,
    link_name: linkName,
    page_path: window.location.pathname,
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 12 — Scroll depth ──────────────────────────────────────────────────

export function trackFortiusScrollDepth(percentage: number) {
  track('fortius_scroll_depth', {
    percentage,
    page_path: '/Fortius',
    partner_name: FORTIUS_PARTNER,
  })
}

// ─── Phase 13 — Engagement time ──────────────────────────────────────────────

export function trackFortiusEngagementTime(seconds: number) {
  track('fortius_engagement_time', {
    seconds,
    page_path: '/Fortius',
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

export function trackFortiusRequestQuote() {
  track('fortius_request_quote_click', { partner_name: FORTIUS_PARTNER })
}
