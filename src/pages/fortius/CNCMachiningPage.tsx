import { Cog, RotateCcw, Layers, Wrench, CheckCircle, Settings } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'cnc-machining',
  name: 'CNC Machining',
  title: 'Precision CNC Machining Services in Bengaluru | Fortius Machining Solutions',
  description:
    'Fortius Machining Solutions offers precision CNC machining services in Bengaluru — CNC milling, turning, and component manufacturing for automotive, aerospace, power electronics, and industrial applications.',
  keywords: [
    'CNC machining Bengaluru',
    'precision machining India',
    'CNC machining services Bangalore',
    'CNC component manufacturing',
    'precision machined parts India',
    'CNC machining automotive',
    'CNC machining aerospace',
  ],
  badge: 'CNC Machining Services · Chikkabanavara, Bengaluru',
  hero: {
    heading: 'Precision CNC Machining Services in Bengaluru',
    subheading:
      'High-accuracy CNC machining for automotive, aerospace, power electronics, and industrial components. Fortius Machining Solutions — Chikkabanavara, Bengaluru, since 2017.',
  },
  ctaText: 'Request CNC Machining Quote',
  ctaEmailSubject: 'CNC Machining Enquiry — Fortius',
  whatIs: {
    definition:
      'CNC (Computer Numerical Control) machining is a subtractive manufacturing process where computer-programmed machine tools remove material from a workpiece to achieve precise geometries, dimensions, and surface finishes. The process uses mills, lathes, routers, and drilling machines guided by G-code programs derived from 3D CAD models or engineering drawings.',
    importance:
      'Precision CNC machining is the backbone of modern manufacturing. From automotive transmission housings to aerospace structural brackets and power electronics enclosures, CNC machining delivers the dimensional accuracy, repeatability, and surface quality that engineering specifications demand. It bridges the gap between design intent and physical reality at every production scale.',
  },
  applications: [
    'Flanges & Housings', 'Shafts & Bushings', 'Brackets & Mounting Plates',
    'Gears & Pulleys', 'Inspection Jigs', 'Tooling Inserts',
    'Structural Components', 'Custom Machined Parts', 'Electronic Enclosures',
    'Motor Components',
  ],
  highlights: [
    { Icon: Cog, title: 'Multi-Axis CNC Milling', desc: 'Complex geometries, pockets, slots, and contoured surfaces machined to tight dimensional tolerances.' },
    { Icon: RotateCcw, title: 'CNC Turning', desc: 'High-accuracy turning for shafts, bushings, flanges, and rotational components across engineering materials.' },
    { Icon: Layers, title: 'Sub-Assembly Manufacturing', desc: 'Multi-part machined metal assemblies for automotive and aerospace production programs.' },
    { Icon: Wrench, title: 'Jigs & Fixtures', desc: 'Custom jig and fixture manufacture for production accuracy, repeatability, and inspection support.' },
    { Icon: Settings, title: 'Special Purpose Machining', desc: 'Custom machining processes tailored to unique production, tooling, and component requirements.' },
    { Icon: CheckCircle, title: 'Quality Verification', desc: 'Systematic dimensional inspection and quality verification at every manufacturing stage.' },
  ],
  industriesUsed: [
    { name: 'EV & Automotive', desc: 'Transmission components, brackets, housings, and precision parts for OEMs and Tier 1 suppliers.' },
    { name: 'Aerospace', desc: 'Structural and mechanical components requiring stringent dimensional accuracy and material traceability.' },
    { name: 'Power Electronics', desc: 'Machined enclosures, heat sinks, and structural parts for inverters, drives, and battery systems.' },
    { name: 'Electricals', desc: 'Precision parts for switchgear, transformers, busbars, and electromechanical assemblies.' },
    { name: 'Industrial Equipment', desc: 'Custom machined parts, fixtures, and sub-assemblies for industrial machinery and capital equipment.' },
    { name: 'Defence', desc: 'Precision machined components with tight tolerances for defence applications and critical systems.' },
  ],
  whyFortius: [
    'Established in 2017 with a focused CNC machining facility in Chikkabanavara, Bengaluru',
    'Multi-axis CNC milling and turning capability for complex component geometries',
    'Experience across automotive, aerospace, power electronics, and industrial sectors',
    'Prototype to production scaling — from single units to batch quantities',
    'Systematic quality inspection at every manufacturing stage',
    'In-house tooling and fixture capability for production repeatability',
    'Export-capable with domestic and international customer delivery',
    'Direct engagement — quick response on enquiries and drawings',
  ],
  faqs: [
    {
      q: 'What CNC machining services does Fortius provide?',
      a: 'Fortius provides precision CNC milling, CNC turning, jig and fixture manufacturing, press tool manufacturing, and mold making. The facility handles complete machined components, sub-assemblies, and custom tooling for automotive, aerospace, power electronics, and industrial applications.',
    },
    {
      q: 'What materials can Fortius CNC machine?',
      a: 'Fortius machines a wide range of engineering materials including mild steel, stainless steel, alloy steel (EN8, EN24, EN31), aluminium alloys, copper, brass, and other non-ferrous metals. Specific material grades can be confirmed on enquiry.',
    },
    {
      q: 'Can Fortius produce prototype CNC machined parts?',
      a: 'Yes. Fortius supports prototype quantities — single pieces or small batches — allowing customers to validate designs before committing to production volumes. Prototype parts are machined to the same standard as production components.',
    },
    {
      q: 'Can Fortius handle production volume machining?',
      a: 'Yes. Fortius supports batch and production quantity machining with structured process setups, dedicated fixturing, and systematic inspection to ensure consistency across production runs.',
    },
    {
      q: 'What dimensional tolerances can Fortius achieve?',
      a: 'Fortius achieves precision tolerances typical of CNC machining, generally in the range of ±0.02 mm to ±0.05 mm for standard work, with tighter tolerances achievable for specific features. Tolerance requirements should be specified on drawings.',
    },
    {
      q: 'Does Fortius serve export customers?',
      a: 'Yes. Fortius manufactures for both domestic Indian customers and export markets, supplying precision components internationally.',
    },
    {
      q: 'How do I get a CNC machining quote from Fortius?',
      a: 'Send your drawing (PDF or DXF), material specification, quantity, and any special requirements to vnyk.hgde@gmail.com or call +91 88804 23666. The Fortius team will review and respond with a quote.',
    },
    {
      q: 'Where is Fortius Machining Solutions located?',
      a: 'Fortius is located at Sy no. 35, Near Over Head Water Tank, Kempapura, Chikkabanavara — 560090, Bengaluru, Karnataka, India.',
    },
  ],
  relatedServices: [
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision multi-axis CNC milling for complex geometries and contoured surfaces.' },
    { name: 'CNC Turning', href: '/fortius/cnc-turning', desc: 'High-accuracy turning for shafts, flanges, bushings, and rotational parts.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Custom jig and fixture manufacturing for production and inspection accuracy.' },
    { name: 'Press Tools', href: '/fortius/press-tools', desc: 'Precision press tool manufacture for sheet metal forming and stamping.' },
  ],
}

export function CNCMachiningPage() {
  return <FortiusServicePage service={service} />
}
