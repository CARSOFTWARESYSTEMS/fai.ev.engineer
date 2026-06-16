import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Cog, Plane, Wrench, Users } from 'lucide-react'
import {
  trackFortiusFooterPhoneClick,
  trackFortiusFooterEmailClick,
  trackFortiusFooterQuoteClick,
  trackFortiusFooterNavigationClick,
  trackFortiusFooterPartnerClick,
  trackFortiusDirectionsClick,
  trackFortiusExternalLinkClick,
} from '../../services/AnalyticsService'

const FORTIUS_MAPS_URL =
  'https://www.google.com/maps/place/Fortius+Machining+Solutions+Pvt.+Ltd./@13.1029875,77.4992532,1046m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae2300551346fd:0x884f69eefd04da5f!8m2!3d13.1029875!4d77.5018281!16s%2Fg%2F11yfjw4rl_?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D'

// ─── Data ─────────────────────────────────────────────────────────────────────

const capabilities = [
  'Precision CNC Milling',
  'CNC Turning',
  'Machined Components',
  'Jigs & Fixtures',
  'Press Tools',
  'Molds & Tooling',
]

const industries = [
  'EV & Automotive',
  'Aerospace',
  'Power Electronics',
  'Electricals',
  'Industrial Manufacturing',
  'Export Markets',
]

const leadershipNav = [
  { label: 'About Us',                href: '#leadership' },
  { label: 'Manufacturing Facility',  href: '#manufacturing' },
  { label: 'Gallery',                 href: '#gallery' },
  { label: 'Contact',                 href: '#contact' },
]

// ─── Reusable section heading ─────────────────────────────────────────────────

function ColHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-widest mb-5">
      {icon && <span className="text-primary">{icon}</span>}
      {children}
    </h3>
  )
}

// ─── Footer link ──────────────────────────────────────────────────────────────

function FooterAnchor({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block text-sm text-slate-400 hover:text-white transition-colors py-0.5"
    >
      {children}
    </a>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FortiusFooter() {
  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-28">

        {/* Main grid — 1 col mobile, 2 col tablet, 5 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* ── Col 1: Brand + company info ─────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">Fortius</span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                  Machining Solutions
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Fortius Machining Solutions Private Limited
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              High precision manufacturing partner specialising in CNC machining, tooling,
              assemblies, and engineered components.
            </p>

            {/* Company info */}
            <dl className="space-y-2 text-xs text-slate-500">
              <div>
                <dt className="text-slate-400 font-semibold">GSTIN</dt>
                <dd className="font-mono text-slate-300 mt-0.5">29AADCF1785B1ZQ</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">CIN</dt>
                <dd className="font-mono text-slate-300 mt-0.5">U29309KA2017PTC105628</dd>
              </div>
              <div className="flex gap-6">
                <div>
                  <dt className="text-slate-400 font-semibold">Founded</dt>
                  <dd className="text-slate-300 mt-0.5">2017</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold">Status</dt>
                  <dd className="text-slate-300 mt-0.5">Active Company</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* ── Col 2: Capabilities ─────────────────────────────────────── */}
          <div>
            <ColHeading icon={<Cog className="w-3.5 h-3.5" />}>Capabilities</ColHeading>
            <ul className="space-y-2">
              {capabilities.map((cap) => (
                <li key={cap}>
                  <FooterAnchor
                    href="#capabilities"
                    onClick={() => trackFortiusFooterNavigationClick(cap)}
                  >
                    {cap}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Industries ───────────────────────────────────────── */}
          <div>
            <ColHeading icon={<Plane className="w-3.5 h-3.5" />}>Industries</ColHeading>
            <ul className="space-y-2">
              {industries.map((ind) => (
                <li key={ind}>
                  <FooterAnchor
                    href="#industries"
                    onClick={() => trackFortiusFooterNavigationClick(ind)}
                  >
                    {ind}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Leadership + navigation ─────────────────────────── */}
          <div>
            <ColHeading icon={<Users className="w-3.5 h-3.5" />}>Leadership</ColHeading>

            {/* Directors */}
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-white font-medium">Vinayak Hegde</p>
                <p className="text-xs text-slate-500">Founder &amp; Director</p>
              </div>
              <div>
                <p className="text-sm text-white font-medium">Valiya Parambath Kiranlal</p>
                <p className="text-xs text-slate-500">Founder &amp; Director</p>
              </div>
            </div>

            {/* Nav links */}
            <ul className="space-y-2">
              {leadershipNav.map(({ label, href }) => (
                <li key={label}>
                  <FooterAnchor
                    href={href}
                    onClick={() => trackFortiusFooterNavigationClick(label)}
                  >
                    {label}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 5: Contact ──────────────────────────────────────────── */}
          <div>
            <ColHeading icon={<Wrench className="w-3.5 h-3.5" />}>Contact</ColHeading>

            {/* Phone */}
            <a
              href="tel:+918880423666"
              onClick={trackFortiusFooterPhoneClick}
              className="flex items-start gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3 group"
            >
              <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:text-white transition-colors" />
              <span>+91 88804 23666</span>
            </a>

            {/* Email */}
            <a
              href="mailto:vnyk.hgde@gmail.com"
              onClick={trackFortiusFooterEmailClick}
              className="flex items-start gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 group"
            >
              <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:text-white transition-colors" />
              <span>vnyk.hgde@gmail.com</span>
            </a>

            {/* Address */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <address className="not-italic text-sm text-slate-400 leading-relaxed">
                Sy no. 35, Near Over Head Water Tank<br />
                Kempapura, Chikkabanavara<br />
                Bengaluru – 560090<br />
                Karnataka, India
              </address>
            </div>

            {/* Google Maps link */}
            <a
              href={FORTIUS_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFortiusDirectionsClick('footer')}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-white transition-colors mb-6 ml-6 underline underline-offset-2"
            >
              <MapPin className="w-3 h-3 shrink-0" />
              View on Google Maps →
            </a>

            {/* CTAs — min 44px touch height */}
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:vnyk.hgde@gmail.com"
                onClick={trackFortiusFooterEmailClick}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
              <a
                href="#contact"
                onClick={trackFortiusFooterQuoteClick}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                Request Quote
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom strip ────────────────────────────────────────────────── */}
        <div className="border-t border-slate-700 mt-12 pt-6">
          <div className="flex flex-col items-center gap-1 text-xs text-slate-500 text-center">
            <p>
              &copy; 2026{' '}
              <a
                href="https://EV.ENGINEER"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackFortiusFooterPartnerClick('EV.ENGINEER', 'https://EV.ENGINEER')
                  trackFortiusExternalLinkClick('https://EV.ENGINEER', 'EV.ENGINEER')
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                EV.ENGINEER
              </a>
              . All rights reserved.
            </p>
            <p>
              Designed by :{' '}
              <a
                href="https://iTelematics.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackFortiusFooterPartnerClick('iTelematics', 'https://iTelematics.com')
                  trackFortiusExternalLinkClick('https://iTelematics.com', 'iTelematics Software Private Limited')
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                iTelematics Software Private Limited
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
