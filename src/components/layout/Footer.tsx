import { Link } from 'react-router-dom'
import { MessageCircle, Mail, Phone, Globe } from 'lucide-react'
import { useBranding } from '../../hooks/useBranding'

const footerSections = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Roadmap', to: '/roadmap' },
      { label: 'Start Free Trial', to: '/register' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
]

function FooterLink({ label, href, to }: { label: string; href?: string; to?: string }) {
  const cls = 'text-sm text-slate-400 hover:text-white transition-colors'
  if (to) return <Link to={to} className={cls}>{label}</Link>
  return <a href={href ?? '#'} className={cls}>{label}</a>
}

export function Footer() {
  const { branding } = useBranding()

  const initial       = branding.businessName.charAt(0).toUpperCase()
  const supportEmail  = branding.supportEmail
  const waNumber      = branding.whatsappNumber
  const techNumber    = branding.technicalSupportNumber
  const website       = branding.website
  const whatsappText  = encodeURIComponent(`${branding.businessName} - FAI Reports`)

  const resourceLinks = [
    { label: 'Documentation', href: '#' },
    { label: 'FAQ', href: '#faq' },
    ...(supportEmail ? [{ label: 'Support', href: `mailto:${supportEmail}` }] : []),
  ]

  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand + Contact column — spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.businessName} className="w-8 h-8 rounded-md object-contain shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{initial}</span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">{branding.businessName}</span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                  powered by{' '}
                  <a
                    href={branding.poweredByUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-white transition-colors"
                  >
                    {branding.poweredByText}
                  </a>
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Browser-based toolkit for engineering drawing ballooning and AS9102 First Article Inspection report preparation.
            </p>

            {/* Website */}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3 group"
              >
                <Globe className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Email */}
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5 group"
              >
                <Mail className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                {supportEmail}
              </a>
            )}

            {/* WhatsApp / Call */}
            {(waNumber || techNumber) && (
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    WhatsApp / Call
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {waNumber && (
                    <ContactRow
                      number={waNumber}
                      label="Sales & Marketing"
                      whatsappText={whatsappText}
                    />
                  )}
                  {techNumber && techNumber !== waNumber && (
                    <ContactRow
                      number={techNumber}
                      label="Technical Support"
                      whatsappText={whatsappText}
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                  Tap to open WhatsApp with a prefilled message.
                </p>
              </div>
            )}
          </div>

          {/* Product section */}
          {footerSections.slice(0, 1).map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
                {section.heading}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}><FooterLink {...link} /></li>
                ))}
              </ul>
            </div>
          ))}

          {/* Resources section — built from branding */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}><FooterLink {...link} /></li>
              ))}
            </ul>
          </div>

          {/* Company section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              <li>
                {website
                  ? <a href={website} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-white transition-colors">
                      About {branding.businessName}
                    </a>
                  : <span className="text-sm text-slate-500">About {branding.businessName}</span>
                }
              </li>
              {supportEmail && (
                <li>
                  <a href={`mailto:${supportEmail}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal section */}
          {footerSections.slice(2).map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
                {section.heading}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}><FooterLink {...link} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 mt-12 pt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500 text-center">
            Designed for manufacturers, engineering teams, quality departments, and inspection professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} {branding.businessName}. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              powered by{' '}
              <a
                href={branding.poweredByUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-400 transition-colors"
              >
                {branding.poweredByText}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function ContactRow({ number, label, whatsappText }: { number: string; label: string; whatsappText: string }) {
  const clean   = number.replace(/\D/g, '')
  const display = `+${clean}`
  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://wa.me/${clean}?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#25D366] transition-colors group"
        aria-label={`WhatsApp ${display}`}
      >
        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]/60 group-hover:text-[#25D366] transition-colors" />
        {display}
      </a>
      <a
        href={`tel:+${clean}`}
        className="text-slate-600 hover:text-slate-400 transition-colors"
        aria-label={`Call ${display}`}
      >
        <Phone className="w-3 h-3" />
      </a>
      <span className="text-[10px] text-slate-600">{label}</span>
    </div>
  )
}
