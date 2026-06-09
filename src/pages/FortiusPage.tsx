import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Cog,
  RotateCcw,
  Layers,
  Wrench,
  Hammer,
  Settings,
  Car,
  Plane,
  Zap,
  Plug,
  Factory,
  Globe,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Building2,
  Calendar,
  Send,
  FileCheck2,
  X,
  ChevronLeft,
  ChevronRight,
  Navigation,
  ArrowRight,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FortiusHeader } from '../components/layout/FortiusHeader'
import { FortiusFooter } from '../components/layout/FortiusFooter'
import { FortiusFAQ } from '../components/fortius/FortiusFAQ'
import type { FAQItem } from '../components/fortius/FortiusFAQ'
import {
  trackFortiusPageView,
  trackFortiusFAIToolkitSectionView,
  trackFortiusFAIToolkitCTAClick,
  trackFortiusFAISupportContactClick,
  trackFortiusFloatingCallClick,
  trackFortiusFloatingWhatsAppClick,
  trackFortiusDirectionsClick,
  trackFortiusRelatedServiceClick,
  trackFortiusTechnologyPartnersView,
  trackFortiusPartnerClick,
  trackFortiusPartnerCTAClick,
  trackFortiusExternalPartnerNavigation,
  trackFortiusHeroQuoteClick,
  trackFortiusHeroCapabilitiesClick,
  trackFortiusContactFormOpen,
  trackFortiusContactFormSubmit,
  trackFortiusLeadGenerated,
  trackFortiusContactFormError,
  trackFortiusGalleryView,
  trackFortiusGalleryImageClick,
  trackFortiusGalleryLightboxOpen,
  trackFortiusFounderClick,
  trackFortiusLinkedInClick,
  trackFortiusFounderPhoneClick,
  trackFortiusFounderEmailClick,
  trackFortiusScrollDepth,
  trackFortiusEngagementTime,
  trackFortiusExternalLinkClick,
} from '../services/AnalyticsService'

const FORTIUS_MAPS_URL =
  'https://www.google.com/maps/place/Fortius+Machining+Solutions+Pvt.+Ltd./@13.1029875,77.4992532,1046m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae2300551346fd:0x884f69eefd04da5f!8m2!3d13.1029875!4d77.5018281!16s%2Fg%2F11yfjw4rl_?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardItem {
  Icon: LucideIcon
  title: string
  description: string
}

interface GalleryItem {
  src: string
  alt: string
}

interface FormState {
  name: string
  company: string
  email: string
  phone: string
  requirement: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const capabilities: CardItem[] = [
  {
    Icon: Cog,
    title: 'Precision CNC Milling',
    description:
      'Multi-axis CNC milling for complex geometries, pockets, slots, and contoured surfaces with tight dimensional tolerances.',
  },
  {
    Icon: RotateCcw,
    title: 'CNC Turning Components',
    description:
      'High-accuracy CNC turning for shafts, bushings, flanges, and rotational components across a range of engineering materials.',
  },
  {
    Icon: Layers,
    title: 'Machined Metal Assemblies',
    description:
      'Complete sub-assembly manufacturing — multi-part machined metal assemblies for automotive and aerospace applications.',
  },
  {
    Icon: Wrench,
    title: 'Jigs & Fixtures',
    description:
      'Custom jig and fixture design and manufacture for production accuracy, repeatability, and quality inspection.',
  },
  {
    Icon: Hammer,
    title: 'Press Tools & Molds',
    description:
      'Precision press tool and mold manufacturing for sheet metal forming, stamping, and component shaping applications.',
  },
  {
    Icon: Settings,
    title: 'Special Purpose Manufacturing',
    description:
      'Custom special purpose manufacturing processes tailored to specific production, tooling, and component requirements.',
  },
]

const industries: CardItem[] = [
  {
    Icon: Car,
    title: 'EV & Automotive',
    description:
      'Precision machined components and assemblies for automotive OEMs and Tier 1/2 suppliers across vehicle programs.',
  },
  {
    Icon: Plane,
    title: 'Aerospace',
    description:
      'High-precision components for aerospace structural and mechanical applications requiring stringent dimensional accuracy.',
  },
  {
    Icon: Zap,
    title: 'Power Electronics',
    description:
      'Machined metal components and enclosures for power electronics, inverters, and battery management systems.',
  },
  {
    Icon: Plug,
    title: 'Electricals',
    description:
      'Precision parts for electrical switchgear, transformers, busbars, and electromechanical assemblies.',
  },
  {
    Icon: Factory,
    title: 'Industrial Components',
    description:
      'Custom machined parts, fixtures, and sub-assemblies for industrial machinery and capital equipment.',
  },
  {
    Icon: Globe,
    title: 'Export — India & Abroad',
    description:
      'Manufacturing for domestic and export markets, supplying precision components to customers in India and internationally.',
  },
]

const strengthPoints: CardItem[] = [
  {
    Icon: Cog,
    title: 'Precision Machining',
    description:
      'Multi-axis CNC machining capability for tight-tolerance components with consistent dimensional accuracy.',
  },
  {
    Icon: Factory,
    title: 'CNC Production Setup',
    description:
      'Structured shop floor with dedicated CNC milling and turning cells for continuous production operations.',
  },
  {
    Icon: Layers,
    title: 'Sheet Metal & Fabrication',
    description:
      'Sheet metal fabrication and formed components complementing machined parts for complete assemblies.',
  },
  {
    Icon: Wrench,
    title: 'Tooling & Fixtures',
    description:
      'In-house tooling and fixture capability supporting volume production with repeatable quality outputs.',
  },
  {
    Icon: CheckCircle,
    title: 'Quality-Focused Workflow',
    description:
      'Systematic inspection and quality verification at every stage of the manufacturing process.',
  },
  {
    Icon: Globe,
    title: 'Online & Offline Sales',
    description:
      'Products and services available through online inquiry and direct engagement for domestic and export customers.',
  },
]

const companyInfo = [
  { label: 'Company Name', value: 'Fortius Machining Solutions Private Limited' },
  { label: 'Founded', value: '2017' },
  { label: 'CIN', value: 'U29309KA2017PTC105628' },
  { label: 'GSTIN', value: '29AADCF1785B1ZQ' },
  { label: 'Location', value: 'Bengaluru, Karnataka' },
  { label: 'Manufacturing Area', value: 'Peenya / Doddanna Industrial Estate, Bengaluru' },
  { label: 'Business Type', value: 'Precision machining and manufacturing services' },
  { label: 'Markets', value: 'India and abroad' },
]

const galleryItems: GalleryItem[] = [
  { src: '/Fortius/0.webp', alt: 'Fortius Machining Solutions Pvt. Ltd. factory signboard, Peenya 2nd Stage, Bangalore-560058' },
  { src: '/Fortius/4.webp', alt: 'Modern CNC machining centre at Fortius Machining Solutions manufacturing facility' },
  { src: '/Fortius/2.webp', alt: 'CNC production machines (FMS-CNC-06) on the Fortius Machining Solutions shop floor' },
  { src: '/Fortius/3.webp', alt: 'CNC production floor overview — Fortius Machining Solutions, Bengaluru' },
  { src: '/Fortius/5.webp', alt: 'Sheet metal fabrication and production floor with press brake at Fortius Machining Solutions' },
  { src: '/Fortius/11.webp', alt: 'Fabricated metal components on powder coating rack at Fortius Machining Solutions' },
  { src: '/Fortius/7.webp', alt: 'Industrial processing equipment — powder coating / heat treatment oven at Fortius Machining Solutions' },
  { src: '/Fortius/8.webp', alt: 'Exterior view of Fortius Machining Solutions manufacturing facility, Bengaluru' },
  { src: '/Fortius/6.webp', alt: 'Fortius Machining Solutions exterior signage at manufacturing unit' },
  { src: '/Fortius/9.webp', alt: 'Engineering raw material stock — machining material slabs at Fortius Machining Solutions' },
  { src: '/Fortius/1.webp', alt: 'Manufacturing facility logistics and material handling area at Fortius Machining Solutions' },
  { src: '/Fortius/10.webp', alt: 'Fortius Machining Solutions shop floor — manufacturing operations' },
]

const strengthImages: GalleryItem[] = [
  { src: '/Fortius/4.webp', alt: 'Modern CNC machining centre at Fortius Machining Solutions' },
  { src: '/Fortius/5.webp', alt: 'Sheet metal and fabrication production floor' },
  { src: '/Fortius/11.webp', alt: 'Fabricated components on powder coating rack' },
  { src: '/Fortius/8.webp', alt: 'Exterior of Fortius Machining Solutions manufacturing facility' },
]

interface WhyReason {
  Icon: LucideIcon
  title: string
  desc: string
}

const whyChooseReasons: WhyReason[] = [
  {
    Icon: Cog,
    title: 'Precision CNC Machining Expertise',
    desc: 'Multi-axis CNC milling and turning capability delivering tight-tolerance components for demanding engineering applications.',
  },
  {
    Icon: Plane,
    title: 'Aerospace Manufacturing Support',
    desc: 'Structural and mechanical component manufacturing meeting the dimensional accuracy and engineering discipline aerospace programs require.',
  },
  {
    Icon: Car,
    title: 'Automotive Manufacturing Support',
    desc: 'Proven supply to automotive OEMs and Tier 1/2 suppliers — from prototype validation through batch production for ICE and EV programs.',
  },
  {
    Icon: Zap,
    title: 'Power Electronics Components',
    desc: 'Machined enclosures, structural parts, and assemblies for inverters, motor drives, battery systems, and power conversion equipment.',
  },
  {
    Icon: CheckCircle,
    title: 'Engineering-First Approach',
    desc: 'Every component is manufactured strictly to drawing specification — engineering intent is respected from drawing to finished part.',
  },
  {
    Icon: RotateCcw,
    title: 'Prototype to Production',
    desc: 'Single prototype pieces or production batch quantities — Fortius supports the full journey from design validation to volume supply.',
  },
  {
    Icon: Wrench,
    title: 'In-House Tooling & Fixtures',
    desc: 'Complete jig, fixture, press tool, and mold manufacturing capability supporting both in-house production and customer requirements.',
  },
  {
    Icon: Globe,
    title: 'Export Manufacturing Capability',
    desc: 'Supplying precision machined components to domestic Indian customers and international export markets since 2017.',
  },
  {
    Icon: Users,
    title: 'Direct Engagement',
    desc: 'Direct access to the Fortius team — quick response on drawings, quotations, and technical queries without layers of intermediary.',
  },
]

interface ServiceCard {
  Icon: LucideIcon
  title: string
  desc: string
  href: string
}

const manufacturingServices: ServiceCard[] = [
  {
    Icon: Cog,
    title: 'CNC Machining',
    desc: 'Complete CNC machining services — milling, turning, and precision component manufacture for all engineering applications.',
    href: '/fortius/cnc-machining',
  },
  {
    Icon: Layers,
    title: 'CNC Milling',
    desc: 'Multi-axis CNC milling for flat surfaces, pockets, slots, complex profiles, and contoured geometries.',
    href: '/fortius/cnc-milling',
  },
  {
    Icon: RotateCcw,
    title: 'CNC Turning',
    desc: 'High-accuracy turning for shafts, bushings, flanges, threaded components, and all rotational parts.',
    href: '/fortius/cnc-turning',
  },
  {
    Icon: Plane,
    title: 'Aerospace Components',
    desc: 'Precision machined structural parts, brackets, jigs, and fixtures for aerospace manufacturing programs.',
    href: '/fortius/aerospace-components',
  },
  {
    Icon: Car,
    title: 'Automotive Components',
    desc: 'Precision machined components for automotive OEMs, EV programs, and Tier 1/2 suppliers.',
    href: '/fortius/automotive-components',
  },
  {
    Icon: Wrench,
    title: 'Jigs & Fixtures',
    desc: 'Custom drill jigs, assembly fixtures, inspection fixtures, and welding fixtures for production and quality operations.',
    href: '/fortius/jigs-and-fixtures',
  },
  {
    Icon: Hammer,
    title: 'Press Tools',
    desc: 'Precision blanking dies, forming tools, compound dies, and progressive die tooling for sheet metal operations.',
    href: '/fortius/press-tools',
  },
]

const mainFAQs: FAQItem[] = [
  {
    q: 'What CNC machining services does Fortius provide?',
    a: 'Fortius provides precision CNC milling, CNC turning, jig and fixture manufacturing, press tool manufacturing, mold making, and metal sub-assembly production. The facility handles components for automotive, aerospace, power electronics, electricals, and industrial applications.',
  },
  {
    q: 'Where is Fortius Machining Solutions located?',
    a: 'Fortius is located at Doddanna Industrial Estate, Peenya, Bengaluru — 560058, Karnataka, India. Peenya is one of the largest industrial areas in Asia, with excellent logistics connectivity across India.',
  },
  {
    q: 'Does Fortius manufacture aerospace components?',
    a: 'Yes. Fortius manufactures precision CNC machined components for aerospace structural and mechanical applications — including structural brackets, housings, jig bodies, assembly fixtures, and inspection tooling. Components are manufactured to drawing specification with systematic quality verification.',
  },
  {
    q: 'Does Fortius support automotive manufacturing?',
    a: 'Yes. Fortius supplies precision machined components to automotive OEMs, EV programs, and Tier 1/2 suppliers. Components include transmission parts, engine brackets, housings, shafts, and assembly sub-components for both internal combustion and electric vehicle programs.',
  },
  {
    q: 'Can Fortius manufacture components for electric vehicles (EVs)?',
    a: 'Yes. Fortius manufactures EV-specific machined components — motor mounts, battery enclosure parts, power electronics brackets, drive system components, and EV structural parts. The team is experienced with the specific requirements of EV programs.',
  },
  {
    q: 'What materials can Fortius machine?',
    a: 'Fortius machines a wide range of engineering materials including mild steel, EN8, EN24, EN31 alloy steels, stainless steel, aluminium alloys, copper, brass, and other non-ferrous metals. Material suitability for specific applications can be confirmed on enquiry.',
  },
  {
    q: 'Can Fortius support prototype manufacturing?',
    a: 'Yes. Fortius supports prototype quantities — single pieces or small batches — allowing customers to validate designs before committing to production volumes. Prototype parts are machined to the same standard as production components.',
  },
  {
    q: 'Can Fortius handle production volume manufacturing?',
    a: 'Yes. Fortius supports batch and production quantity manufacturing with structured process setups, dedicated fixturing, and systematic inspection to ensure dimensional consistency across production runs.',
  },
  {
    q: 'Does Fortius manufacture jigs and fixtures?',
    a: 'Yes. Fortius manufactures custom drill jigs, assembly fixtures, inspection fixtures, welding fixtures, checking gauges, and CMM fixtures for automotive, aerospace, and industrial manufacturing operations.',
  },
  {
    q: 'Does Fortius manufacture press tools?',
    a: 'Yes. Fortius manufactures precision press tools including blanking dies, piercing tools, forming dies, compound dies, and progressive die tooling for sheet metal stamping and forming operations.',
  },
  {
    q: 'Does Fortius support export customers?',
    a: 'Yes. Fortius manufactures for both domestic Indian customers and international export markets, supplying precision machined components to customers abroad.',
  },
  {
    q: 'What industries does Fortius serve?',
    a: 'Fortius serves automotive (including EV), aerospace, power electronics, electricals, industrial equipment, and defence sectors. The facility has experience supplying precision machined components and tooling across all these industries.',
  },
  {
    q: 'What dimensional tolerances can Fortius achieve?',
    a: 'Fortius achieves CNC machining tolerances generally in the range of ±0.02 mm to ±0.05 mm for standard work, with tighter tolerances achievable for specific critical features. Tolerance requirements must be clearly specified on engineering drawings.',
  },
  {
    q: 'Can Fortius support AS9102 First Article Inspection (FAI) requirements?',
    a: 'Fortius manufactures components to drawing specification and can support customers\' First Article Inspection programs. For digital FAI report preparation — including AS9102 balloon drawings and structured FAI report documentation — Fortius recommends the FAI.EV.ENGINEER toolkit.',
  },
  {
    q: 'How do I get a manufacturing quote from Fortius?',
    a: 'Send your engineering drawing (PDF or DXF), material specification, quantity, and any special requirements to vnyk.hgde@gmail.com or call +91 88804 23666. The Fortius team will review and respond with a quotation.',
  },
  {
    q: 'When was Fortius Machining Solutions founded?',
    a: 'Fortius Machining Solutions Private Limited was founded in 2017. The company has been operating from its manufacturing facility at Peenya, Bengaluru since establishment.',
  },
  {
    q: 'Does Fortius manufacture molds?',
    a: 'Yes. Fortius has mold manufacturing capability alongside press tools, jigs, and fixtures, providing customers with complete tooling solutions alongside component manufacturing.',
  },
  {
    q: 'Can Fortius supply machined metal assemblies?',
    a: 'Yes. Fortius manufactures multi-part machined metal assemblies — coordinating milling, turning, and auxiliary operations to deliver complete sub-assemblies for automotive and other manufacturing programs.',
  },
  {
    q: 'What is the lead time for CNC machined components from Fortius?',
    a: 'Lead time depends on component complexity, quantity, and current production schedule. Prototype parts can often be delivered in 1–2 weeks; production batches depend on quantity and setup. Lead times should be discussed directly with the Fortius team on enquiry.',
  },
  {
    q: 'What is Fortius\'s GSTIN and CIN?',
    a: 'Fortius Machining Solutions Private Limited — GSTIN: 29AADCF1785B1ZQ, CIN: U29309KA2017PTC105628. The registered office is at Doddanna Industrial Estate, Peenya, Bengaluru — 560058.',
  },
]

// ─── Hero illustration ────────────────────────────────────────────────────────

function MachinedComponentIllustration() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-primary/20">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3 border-b border-slate-700">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="flex-1 text-center text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          FMS-FLANGE-001 — CNC Machined Component
        </span>
        <span className="text-[10px] font-mono text-slate-500 shrink-0">REV: A</span>
      </div>
      <svg
        viewBox="0 0 560 320"
        className="w-full"
        style={{ background: '#0d1117' }}
        aria-label="Engineering drawing of a CNC machined flanged component by Fortius Machining Solutions"
        role="img"
      >
        <defs>
          <pattern id="bp-grid-fms" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(30,100,220,0.12)" strokeWidth="0.5" />
          </pattern>
          <marker id="arr-fms" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#64748b" />
          </marker>
          <marker id="arr-r-fms" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#64748b" />
          </marker>
        </defs>
        <rect width="560" height="320" fill="url(#bp-grid-fms)" />

        {/* Main flange body */}
        <rect x="110" y="75" width="300" height="170" rx="3" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        {/* Left mounting ear */}
        <rect x="68" y="100" width="46" height="48" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        {/* Right mounting ear */}
        <rect x="406" y="100" width="46" height="48" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1.5" />

        {/* Central bore */}
        <circle cx="260" cy="160" r="52" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="260" cy="160" r="32" fill="none" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="5,3" opacity="0.5" />

        {/* Corner bolt holes */}
        <circle cx="152" cy="112" r="9" fill="none" stroke="#60a5fa" strokeWidth="1" />
        <circle cx="152" cy="208" r="9" fill="none" stroke="#60a5fa" strokeWidth="1" />
        <circle cx="368" cy="112" r="9" fill="none" stroke="#60a5fa" strokeWidth="1" />
        <circle cx="368" cy="208" r="9" fill="none" stroke="#60a5fa" strokeWidth="1" />

        {/* Centerlines */}
        <line x1="260" y1="40" x2="260" y2="290" stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="10,4,2,4" opacity="0.6" />
        <line x1="40" y1="160" x2="490" y2="160" stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="10,4,2,4" opacity="0.6" />

        {/* Crosshatch left ear */}
        {[103, 108, 113, 118, 123, 128, 133, 138].map((y) => (
          <line key={`lh${y}`} x1="70" y1={y} x2="110" y2={y} stroke="#60a5fa" strokeWidth="0.3" opacity="0.3" />
        ))}
        {/* Crosshatch right ear */}
        {[103, 108, 113, 118, 123, 128, 133, 138].map((y) => (
          <line key={`rh${y}`} x1="408" y1={y} x2="450" y2={y} stroke="#60a5fa" strokeWidth="0.3" opacity="0.3" />
        ))}

        {/* Dim: overall width */}
        <line x1="68" y1="272" x2="452" y2="272" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arr-r-fms)" markerEnd="url(#arr-fms)" />
        <line x1="68" y1="258" x2="68" y2="277" stroke="#64748b" strokeWidth="0.5" />
        <line x1="452" y1="258" x2="452" y2="277" stroke="#64748b" strokeWidth="0.5" />
        <text x="260" y="287" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">380.00 ±0.05</text>

        {/* Dim: height */}
        <line x1="492" y1="75" x2="492" y2="245" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arr-r-fms)" markerEnd="url(#arr-fms)" />
        <line x1="450" y1="75" x2="497" y2="75" stroke="#64748b" strokeWidth="0.5" />
        <line x1="450" y1="245" x2="497" y2="245" stroke="#64748b" strokeWidth="0.5" />
        <text x="510" y="164" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace" transform="rotate(90,510,164)">170.00 ±0.05</text>

        {/* Bore annotation */}
        <line x1="260" y1="160" x2="312" y2="138" stroke="#64748b" strokeWidth="0.6" />
        <text x="316" y="132" fontSize="9" fill="#94a3b8" fontFamily="monospace">Ø104.00</text>
        <text x="316" y="143" fontSize="8" fill="#60a5fa" fontFamily="monospace">±0.02 H7</text>

        {/* Surface finish */}
        <text x="152" y="63" fontSize="8" fill="#86efac" fontFamily="monospace">⊹ Ra 1.6 μm</text>

        {/* Material note */}
        <text x="22" y="28" fontSize="8.5" fill="#fbbf24" fontFamily="monospace">MATL: EN8 STEEL | HRC 28–32 | FINISH: PHOSPHATE</text>

        {/* Title block */}
        <rect x="1" y="296" width="558" height="22" fill="#0f1729" stroke="#334155" strokeWidth="0.8" />
        <line x1="186" y1="296" x2="186" y2="318" stroke="#334155" strokeWidth="0.5" />
        <line x1="372" y1="296" x2="372" y2="318" stroke="#334155" strokeWidth="0.5" />
        <text x="93" y="310" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">FORTIUS MACHINING SOLUTIONS PVT LTD</text>
        <text x="279" y="307" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">PART: FMS-FLANGE-001 | DRG: FMS-001</text>
        <text x="279" y="315" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">SCALE: 1:2 | TOL: ±0.05 UNLESS NOTED</text>
        <text x="465" y="307" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">REV: A | Peenya, Bengaluru</text>
        <text x="465" y="315" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">FORTIUS MACHINING SOLUTIONS</text>
      </svg>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxState {
  images: GalleryItem[]
  index: number
}

function Lightbox({ images, index: initialIndex, onClose }: LightboxState & { onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const current = images[index]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft')  setIndex((i) => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1) }}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next */}
      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1) }}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="flex flex-col items-center max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[80vh] max-w-full rounded-xl object-contain"
        />
        <p className="text-white/60 text-sm mt-3 text-center px-4 leading-snug">{current.alt}</p>
        <p className="text-white/30 text-xs mt-1">{index + 1} / {images.length}</p>
      </div>
    </div>
  )
}

// ─── Gallery image with fallback ──────────────────────────────────────────────

function GalleryImage({
  src,
  alt,
  className = '',
  onClick,
}: GalleryItem & { className?: string; onClick?: () => void }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div
        className={`bg-slate-100 rounded-xl border-2 border-dashed border-border flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs text-text-secondary text-center px-4 leading-tight">{alt}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      onClick={onClick}
      className={`object-cover rounded-xl ${className} ${onClick ? 'cursor-pointer hover:brightness-90 transition-[filter]' : ''}`}
    />
  )
}

// ─── Founder photo with initials fallback ─────────────────────────────────────

function FounderPhoto({ src, name }: { src: string; name: string }) {
  const [error, setError] = useState(false)
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  if (error) {
    return <span className="text-2xl font-bold text-primary/60">{initials}</span>
  }
  return (
    <img
      src={src}
      alt={`Photo of ${name}, Founder and Director of Fortius Machining Solutions`}
      loading="lazy"
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  )
}

// ─── Contact form ─────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '', company: '', email: '', phone: '', requirement: '',
  })
  const formOpened = useRef(false)

  function set(field: keyof FormState) {
    return (e: { target: { value: string } }) => {
      if (!formOpened.current) {
        formOpened.current = true
        trackFortiusContactFormOpen()
      }
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name || !form.company || !form.email || !form.requirement) {
      trackFortiusContactFormError('Required fields missing')
      return
    }
    trackFortiusContactFormSubmit(form.name, form.company)
    trackFortiusLeadGenerated(form.name, form.company, form.email)
    const body = [
      `Name: ${form.name}`,
      `Company: ${form.company}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `\nRequirement:\n${form.requirement}`,
    ].join('\n')
    const subject = encodeURIComponent(`Manufacturing Enquiry — ${form.company || form.name}`)
    window.location.href = `mailto:vnyk.hgde@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fm-name" className="block text-sm font-medium text-text-primary mb-1.5">
            Name *
          </label>
          <input
            id="fm-name"
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Your name"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="fm-company" className="block text-sm font-medium text-text-primary mb-1.5">
            Company *
          </label>
          <input
            id="fm-company"
            type="text"
            required
            value={form.company}
            onChange={set('company')}
            placeholder="Company name"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="fm-email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email *
          </label>
          <input
            id="fm-email"
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="you@company.com"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="fm-phone" className="block text-sm font-medium text-text-primary mb-1.5">
            Phone
          </label>
          <input
            id="fm-phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+91 00000 00000"
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="fm-req" className="block text-sm font-medium text-text-primary mb-1.5">
          Requirement *
        </label>
        <textarea
          id="fm-req"
          required
          rows={4}
          value={form.requirement}
          onChange={set('requirement')}
          placeholder="Describe your machining requirement — material, quantity, dimensions, tolerances, and any drawing or specification details..."
          className="input-field resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Upload Drawing{' '}
          <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <div className="border-2 border-dashed border-border rounded-lg px-5 py-6 text-center bg-background">
          <p className="text-sm text-text-secondary">
            Drawing upload coming soon. Please attach your drawing to the email that opens on submission.
          </p>
        </div>
      </div>
      <button type="submit" className="btn-primary text-base px-10 py-3.5">
        <Send className="w-4 h-4" />
        Submit Requirement
      </button>
    </form>
  )
}

// ─── Technology Partners section ─────────────────────────────────────────────

const technologyPartners = [
  {
    name: 'iTelematics',
    url: 'https://iTelematics.com',
    tagline: 'Engineering Software & Digital Transformation',
    description:
      'iTelematics Software Private Limited provides engineering software solutions, mobile applications, IoT platforms, connected device solutions, digital transformation services, and custom software development for industrial and engineering businesses.',
    keywords: ['Engineering Software', 'IoT Platforms', 'Mobile Apps', 'Digital Transformation', 'Industrial Solutions'],
    logo: 'iT',
    logoColor: '#0F6FFF',
  },
  {
    name: 'EV.ENGINEER',
    url: 'https://autonomous.ev.engineer',
    tagline: 'EV Technologies & Industrial Innovation',
    description:
      'EV.ENGINEER focuses on engineering innovation, EV technologies, battery intelligence, AI-powered diagnostics, quality engineering, and industrial digitalization initiatives.',
    keywords: ['EV Technologies', 'Battery Intelligence', 'AI Diagnostics', 'Quality Engineering', 'Industrial Digitalization'],
    logo: 'EV',
    logoColor: '#059669',
  },
]

function TechnologyPartnersSection() {
  const ref = useRef<HTMLElement>(null)
  const tracked = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true
          trackFortiusTechnologyPartnersView()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handlePartnerClick(name: string, url: string) {
    trackFortiusPartnerClick(name, url)
    trackFortiusExternalPartnerNavigation(url, name)
  }

  function handleCTAClick(name: string, url: string) {
    trackFortiusPartnerCTAClick(name, url)
    trackFortiusExternalPartnerNavigation(url, name)
  }

  return (
    <section ref={ref} id="technology-partners" className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Globe className="w-3.5 h-3.5" />
            Technology &amp; Engineering Partners
          </div>
          <h2 className="section-title">Technology Partners</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Collaborating with technology and engineering partners to deliver modern manufacturing,
            engineering, quality, and digital transformation solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {technologyPartners.map((partner) => (
            <div
              key={partner.name}
              className="card p-8 flex flex-col gap-5 hover:shadow-md transition-shadow"
            >
              {/* Logo + name */}
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handlePartnerClick(partner.name, partner.url)}
                className="flex items-center gap-4 group"
                aria-label={`Visit ${partner.name} website`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                  style={{ background: partner.logoColor }}
                >
                  {partner.logo}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg group-hover:text-primary transition-colors leading-snug">
                    {partner.name}
                  </h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">{partner.tagline}</p>
                </div>
              </a>

              {/* Description */}
              <p className="text-sm text-text-secondary leading-relaxed flex-1">
                {partner.description}
              </p>

              {/* Keyword chips */}
              <div className="flex flex-wrap gap-2">
                {partner.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-block text-xs font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick(partner.name, partner.url)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 border border-primary/30 text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all w-full"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                Visit {partner.name}
              </a>
            </div>
          ))}
        </div>

        {/* SEO paragraph — visible but understated */}
        <p className="text-center text-sm text-text-secondary mt-10 max-w-3xl mx-auto leading-relaxed">
          Fortius collaborates with technology partners specialising in engineering software solutions,
          industrial IoT, EV engineering, manufacturing quality systems, and industrial digitalization —
          supporting end-to-end manufacturing and engineering transformation for our customers.
        </p>
      </div>
    </section>
  )
}

// ─── FAI Toolkit highlight ────────────────────────────────────────────────────

function FAIToolkitSection() {
  const ref = useRef<HTMLElement>(null)
  const tracked = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true
          trackFortiusFAIToolkitSectionView()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#EBF3FF] via-white to-white p-8 sm:p-10 lg:p-14 shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── Left: text + CTAs ─────────────────────────────────────────── */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <FileCheck2 className="w-3.5 h-3.5" />
                FAI Engineering Workflow
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-snug mb-5">
                Balloon Drawings and Create AS9102 FAI Reports Faster
              </h2>

              <p className="text-base text-text-secondary leading-relaxed mb-8">
                Fortius supports manufacturing and inspection workflows where customers need drawing
                ballooning, dimensional inspection planning, and AS9102 First Article Inspection
                report preparation. If your team needs help converting engineering drawings into
                organized balloon drawings and structured FAI reports, contact Fortius for support
                and coordination.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://fai.ev.engineer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackFortiusFAIToolkitCTAClick}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Explore FAI.EV.ENGINEER Toolkit
                </a>
                <a
                  href="#contact"
                  onClick={trackFortiusFAISupportContactClick}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 border border-primary/30 text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors w-full sm:w-auto"
                >
                  Contact Fortius for FAI Support
                </a>
              </div>
            </div>

            {/* ── Right: feature cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  Icon: FileCheck2,
                  title: 'Balloon Numbering',
                  desc: 'Annotate every characteristic on engineering drawings with sequential balloon numbers.',
                },
                {
                  Icon: CheckCircle,
                  title: 'AS9102 Reports',
                  desc: 'Structured AS9102 Form 1, 2, and 3 First Article Inspection report preparation.',
                },
                {
                  Icon: Layers,
                  title: 'Inspection Planning',
                  desc: 'Dimensional inspection planning and characteristic tables linked to balloon IDs.',
                },
                {
                  Icon: ExternalLink,
                  title: 'Export & Share',
                  desc: 'Export FAI reports and characteristic data to Excel and AS9102 PDF formats.',
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/80 rounded-xl border border-primary/10 p-4 sm:p-5"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1.5">{title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FortiusPage() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const galleryRef = useRef<HTMLElement>(null)
  const galleryTracked = useRef(false)

  // Gallery view — fires once when section enters viewport
  useEffect(() => {
    const el = galleryRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !galleryTracked.current) {
          galleryTracked.current = true
          trackFortiusGalleryView()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    trackFortiusPageView()
    const prevTitle = document.title
    document.title =
      'Fortius Machining Solutions Private Limited | Precision CNC Machining Bengaluru'
    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = metaDesc?.content ?? ''
    if (metaDesc) {
      metaDesc.content =
        'Precision CNC machining, CNC milling, turning, metal components, assemblies, jigs, fixtures, press tools, and molds for automotive, aerospace, power electronics, and electrical industries. Peenya, Bengaluru.'
    }

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['Organization', 'LocalBusiness', 'ManufacturingBusiness'],
          name: 'Fortius Machining Solutions Private Limited',
          alternateName: 'Fortius',
          url: 'https://fai.ev.engineer/Fortius',
          telephone: '+918880423666',
          email: 'vnyk.hgde@gmail.com',
          foundingDate: '2017',
          identifier: [
            { '@type': 'PropertyValue', name: 'CIN', value: 'U29309KA2017PTC105628' },
            { '@type': 'PropertyValue', name: 'GSTIN', value: '29AADCF1785B1ZQ' },
          ],
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Doddanna Industrial Estate, Peenya',
            addressLocality: 'Bengaluru',
            addressRegion: 'Karnataka',
            postalCode: '560058',
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 13.1029875,
            longitude: 77.5018281,
          },
          description:
            'Precision CNC machining, CNC milling, CNC turning, jigs, fixtures, press tools, and manufacturing solutions for automotive, aerospace, power electronics, and electrical industries. Peenya, Bengaluru.',
          employee: [
            { '@type': 'Person', name: 'Vinayak Hegde', jobTitle: 'Founder / Director' },
            { '@type': 'Person', name: 'Valiya Parambath Kiranlal', jobTitle: 'Founder / Director' },
          ],
          hasMap: FORTIUS_MAPS_URL,
          areaServed: ['India', 'International'],
          knowsAbout: [
            'CNC Machining', 'CNC Milling', 'CNC Turning',
            'Aerospace Components', 'Automotive Components',
            'Jigs and Fixtures', 'Press Tools', 'Metal Fabrication',
          ],
          sameAs: ['https://www.linkedin.com/in/vinayak-hegde-62a6a046/'],
        },
        {
          '@type': 'FAQPage',
          mainEntity: mainFAQs.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        },
      ],
    }
    const script = document.createElement('script')
    script.id = 'fortius-main-schema'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)

    // Scroll depth (25 / 50 / 75 / 90 / 100)
    const firedDepths = new Set<number>()
    function onScroll() {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = Math.round((scrolled / total) * 100)
      for (const threshold of [25, 50, 75, 90, 100]) {
        if (pct >= threshold && !firedDepths.has(threshold)) {
          firedDepths.add(threshold)
          trackFortiusScrollDepth(threshold)
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Engagement time (30 / 60 / 120 / 300 seconds)
    let elapsed = 0
    const engagementTimer = setInterval(() => {
      elapsed += 1
      if ([30, 60, 120, 300].includes(elapsed)) {
        trackFortiusEngagementTime(elapsed)
      }
      if (elapsed >= 300) clearInterval(engagementTimer)
    }, 1000)

    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.content = prevDesc
      document.getElementById('fortius-main-schema')?.remove()
      window.removeEventListener('scroll', onScroll)
      clearInterval(engagementTimer)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <FortiusHeader />

      <main className="flex-1">

        {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-primary-light via-white to-white pt-16 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Manufacturing Partner — Bengaluru, Karnataka
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight max-w-5xl mx-auto">
                Fortius Machining Solutions
                <br />
                <span className="text-primary">Private Limited</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                High-precision CNC machining, metal components, assemblies, tooling, and
                manufacturing solutions for automotive, aerospace, power electronics, and
                electrical industries.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#contact"
                  onClick={trackFortiusHeroQuoteClick}
                  className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
                >
                  Request Manufacturing Quote
                </a>
                <a
                  href="#capabilities"
                  onClick={trackFortiusHeroCapabilitiesClick}
                  className="btn-secondary text-base px-8 py-4 w-full sm:w-auto text-center"
                >
                  View Capabilities
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  Peenya / Doddanna Industrial Estate, Bengaluru
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  Founded 2017
                </span>
              </div>
            </div>

            {/* Engineering drawing illustration */}
            <div className="max-w-3xl mx-auto">
              <MachinedComponentIllustration />
              <p className="text-center text-xs text-text-secondary mt-3">
                Engineering drawing — Fortius Machining Solutions precision CNC machined component
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. Capabilities ─────────────────────────────────────────────── */}
        <section id="capabilities" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Manufacturing Capabilities</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Precision machining services designed for demanding applications across automotive,
                aerospace, power electronics, and electrical industries.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map(({ Icon, title, description }) => (
                <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Industries Served ────────────────────────────────────────── */}
        <section id="industries" className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Industries Served</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Supplying precision machined components and assemblies to customers across multiple
                industry sectors in India and abroad.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map(({ Icon, title, description }) => (
                <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Manufacturing Strength ────────────────────────────────────── */}
        <section id="manufacturing" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Manufacturing Strength</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                A focused manufacturing facility in Bengaluru built for consistent precision and
                quality across every production run.
              </p>
            </div>

            {/* Image + highlights two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-14">
              {/* Image 2×2 grid */}
              <div className="grid grid-cols-2 gap-3">
                {strengthImages.map((img, i) => (
                  <GalleryImage
                    key={img.src}
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-44 sm:h-52"
                    onClick={() => setLightbox({ images: strengthImages, index: i })}
                  />
                ))}
              </div>

              {/* Strength highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {strengthPoints.map(({ Icon, title, description }) => (
                  <div key={title} className="flex flex-col gap-2">
                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-primary">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Why Companies Choose Fortius ─────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Why Companies Choose Fortius</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Engineering discipline, precision capability, and a manufacturing partner approach
                that treats your component as if it were our own.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseReasons.map(({ Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-6 card hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1.5 text-sm sm:text-base">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <a href="#contact" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
                Request Manufacturing Quote
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── 6. Manufacturing Services ────────────────────────────────────── */}
        <section id="services" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Manufacturing Services</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Dedicated service pages with detailed capability information, applications, and
                frequently asked questions for every manufacturing service Fortius provides.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {manufacturingServices.map(({ Icon, title, desc, href }) => (
                <div key={title} className="card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <Link
                      to={href}
                      onClick={() => trackFortiusRelatedServiceClick(title)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      Learn More <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      Request Quote
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FAI Toolkit Highlight ────────────────────────────────────── */}
        <FAIToolkitSection />

        {/* ── 6. Gallery ──────────────────────────────────────────────────── */}
        <section ref={galleryRef} id="gallery" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Facility Gallery</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                A look inside the Fortius Machining Solutions manufacturing facility in Bengaluru.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.map((img, i) => (
                <GalleryImage
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-56 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => {
                    trackFortiusGalleryImageClick(img.alt, i)
                    trackFortiusGalleryLightboxOpen(img.alt, i)
                    setLightbox({ images: galleryItems, index: i })
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Founders & Leadership ─────────────────────────────────────── */}
        <section id="leadership" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Founders &amp; Leadership</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

              {/* Vinayak Hegde */}
              <div
                className="card p-8 flex flex-col items-center text-center gap-4 cursor-default"
                onClick={() => trackFortiusFounderClick('Vinayak Hegde')}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 bg-primary-light flex items-center justify-center shrink-0">
                  <FounderPhoto src="/Fortius/12.jpeg" name="Vinayak Hegde" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Vinayak Hegde</h3>
                  <p className="text-sm text-primary font-semibold mt-0.5">Founder / Director</p>
                </div>
                <div className="flex flex-col gap-2.5 w-full">
                  <a
                    href="tel:+918880423666"
                    onClick={(e) => { e.stopPropagation(); trackFortiusFounderPhoneClick('Vinayak Hegde') }}
                    className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    +91 88804 23666
                  </a>
                  <a
                    href="mailto:vnyk.hgde@gmail.com"
                    onClick={(e) => { e.stopPropagation(); trackFortiusFounderEmailClick('Vinayak Hegde') }}
                    className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    vnyk.hgde@gmail.com
                  </a>
                </div>
                <a
                  href="https://www.linkedin.com/in/vinayak-hegde-62a6a046/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation()
                    trackFortiusLinkedInClick('Vinayak Hegde')
                    trackFortiusExternalLinkClick('https://www.linkedin.com/in/vinayak-hegde-62a6a046/', 'Vinayak Hegde LinkedIn')
                  }}
                  className="btn-secondary text-sm px-5 py-2 w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  LinkedIn Profile
                </a>
              </div>

              {/* Valiya Parambath Kiranlal */}
              <div className="card p-8 flex flex-col items-center text-center gap-4">
                <div className="w-28 h-28 rounded-full bg-primary-light border-2 border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-10 h-10 text-primary/30" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Valiya Parambath Kiranlal</h3>
                  <p className="text-sm text-primary font-semibold mt-0.5">Founder / Director</p>
                </div>
                <p className="text-sm text-text-secondary">Details to be updated.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Company Information ───────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Company Information</h2>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <tbody>
                  {companyInfo.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-white'}>
                      <td className="px-6 py-4 text-sm font-semibold text-text-secondary w-2/5 border-r border-border align-top">
                        {row.label}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 9. Technology Partners ───────────────────────────────────────── */}
        <TechnologyPartnersSection />

        {/* ── 10. FAQ ─────────────────────────────────────────────────────── */}
        <section id="faq" className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Common questions about Fortius Machining Solutions, our manufacturing services,
                capabilities, and how to work with us.
              </p>
            </div>
            <FortiusFAQ faqs={mainFAQs} />
            <div className="mt-10 text-center">
              <p className="text-sm text-text-secondary mb-4">Have a specific question not answered above?</p>
              <a href="#contact" className="btn-primary px-8 py-3.5 inline-flex items-center gap-2">
                Contact Fortius
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── 10. Contact / Quote ──────────────────────────────────────────── */}
        <section id="contact" className="py-20 px-4 bg-background">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title">Looking for a precision machining partner?</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                Submit your requirement and a Fortius team member will get back to you.
              </p>
            </div>
            <div className="card p-8">
              <ContactForm />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-text-secondary">
              <a
                href="tel:+918880423666"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary shrink-0" />
                +91 88804 23666
              </a>
              <a
                href="mailto:vnyk.hgde@gmail.com"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-primary shrink-0" />
                vnyk.hgde@gmail.com
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                Peenya, Bengaluru — 560 058
              </span>
            </div>
          </div>
        </section>

      </main>

      <FortiusFooter />

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* ── Fixed floating CTAs ────────────────────────────────────────────── */}

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

      {/* Bottom-center: Directions — icon-only on mobile, pill on sm+ */}
      <a
        href={FORTIUS_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get directions to Fortius Machining Solutions on Google Maps"
        onClick={() => trackFortiusDirectionsClick('floating')}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center justify-center gap-0 sm:gap-2.5 w-11 h-11 sm:w-auto sm:h-auto sm:pl-4 sm:pr-5 sm:py-3 bg-slate-800 text-white text-sm font-semibold rounded-full shadow-2xl hover:bg-slate-700 active:scale-95 transition-all"
        style={{ boxShadow: '0 4px 24px 0 rgba(15,23,42,0.5)' }}
      >
        <Navigation className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Directions</span>
      </a>

      {/* Bottom-right: WhatsApp */}
      <a
        href={`https://wa.me/918880423666?text=${encodeURIComponent('Hi Fortius, I am interested in your precision machining services.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Fortius on WhatsApp"
        onClick={trackFortiusFloatingWhatsAppClick}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 pl-4 pr-5 py-3 text-white text-sm font-semibold rounded-full shadow-2xl active:scale-95 transition-all"
        style={{ background: '#25D366', boxShadow: '0 4px 24px 0 rgba(37,211,102,0.45)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </a>
    </div>
  )
}
