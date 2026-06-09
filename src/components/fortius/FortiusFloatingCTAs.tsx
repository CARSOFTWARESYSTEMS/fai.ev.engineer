import { Phone, Navigation } from 'lucide-react'
import {
  trackFortiusFloatingCallClick,
  trackFortiusFloatingWhatsAppClick,
  trackFortiusDirectionsClick,
} from '../../services/AnalyticsService'

const FORTIUS_MAPS_URL =
  'https://www.google.com/maps/place/Fortius+Machining+Solutions+Pvt.+Ltd./@13.1029875,77.4992532,1046m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae2300551346fd:0x884f69eefd04da5f!8m2!3d13.1029875!4d77.5018281!16s%2Fg%2F11yfjw4rl_?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D'

const WA_TEXT = encodeURIComponent('Hi Fortius, I am interested in your precision machining services.')

export function FortiusFloatingCTAs() {
  return (
    <>
      {/* Bottom-left: Call Now */}
      <a
        href="tel:+918880423666"
        aria-label="Call Fortius Machining Solutions"
        onClick={trackFortiusFloatingCallClick}
        className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2.5 pl-4 pr-5 py-3 bg-primary text-white text-sm font-semibold rounded-full shadow-2xl hover:bg-primary-dark active:scale-95 transition-all"
        style={{ boxShadow: '0 4px 24px 0 rgba(15,111,255,0.45)' }}
      >
        <Phone className="w-4 h-4 shrink-0" />
        Call Now
      </a>

      {/* Bottom-center: Directions */}
      <a
        href={FORTIUS_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get directions to Fortius Machining Solutions"
        onClick={() => trackFortiusDirectionsClick('floating')}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center justify-center gap-0 sm:gap-2.5 w-11 h-11 sm:w-auto sm:h-auto sm:pl-4 sm:pr-5 sm:py-3 bg-slate-800 text-white text-sm font-semibold rounded-full shadow-2xl hover:bg-slate-700 active:scale-95 transition-all"
        style={{ boxShadow: '0 4px 24px 0 rgba(15,23,42,0.5)' }}
      >
        <Navigation className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Directions</span>
      </a>

      {/* Bottom-right: WhatsApp */}
      <a
        href={`https://wa.me/918880423666?text=${WA_TEXT}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Fortius on WhatsApp"
        onClick={trackFortiusFloatingWhatsAppClick}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 pl-4 pr-5 py-3 text-white text-sm font-semibold rounded-full shadow-2xl active:scale-95 transition-all"
        style={{ background: '#25D366', boxShadow: '0 4px 24px 0 rgba(37,211,102,0.45)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </a>
    </>
  )
}
