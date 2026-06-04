import { Link } from 'react-router-dom'
import { MessageCircle, Mail, Phone } from 'lucide-react'

const WHATSAPP_TEXT = encodeURIComponent('FAI.EV.ENGINEER - FAI Reports')

const whatsappNumbers = [
  { display: '+91 88804 23666', number: '918880423666', region: 'IN' },
  { display: '+44 7714 296479', number: '447714296479', region: 'UK' },
  { display: '+91 91082 06147', number: '919108206147', region: 'IN' },
]

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
      { label: 'Support', href: 'mailto:info@iTelematics.com' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About EV.ENGINEER', href: '#' },
      { label: 'Contact', href: 'mailto:info@iTelematics.com' },
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
  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand + Contact column — spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">FAI Engineer</span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide">by EV.ENGINEER</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Browser-based toolkit for engineering drawing ballooning and AS9102 First Article Inspection report preparation.
            </p>

            {/* Email */}
            <a
              href="mailto:info@iTelematics.com"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5 group"
            >
              <Mail className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
              info@iTelematics.com
            </a>

            {/* WhatsApp numbers */}
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  WhatsApp / Call
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {whatsappNumbers.map((n) => (
                  <div key={n.number} className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${n.number}?text=${WHATSAPP_TEXT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#25D366] transition-colors group"
                      aria-label={`WhatsApp ${n.display}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]/60 group-hover:text-[#25D366] transition-colors" />
                      {n.display}
                    </a>
                    <a
                      href={`tel:${n.number}`}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                      aria-label={`Call ${n.display}`}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] text-slate-600 font-mono">{n.region}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                Tap to open WhatsApp with a prefilled message.
              </p>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
                {section.heading}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
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
              &copy; {new Date().getFullYear()} EV.ENGINEER. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              FAI Engineer — AS9102 First Article Inspection Toolkit
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
