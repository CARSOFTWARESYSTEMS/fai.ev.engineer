import { Car, Cog, CheckCircle, Layers, Settings, Wrench } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'automotive-components',
  name: 'Automotive Components',
  title: 'Automotive Component Manufacturing | Fortius Machining Solutions Bengaluru',
  description:
    'Precision automotive component manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined automotive and EV components for OEMs and Tier 1/2 suppliers across automotive and electric vehicle programs.',
  keywords: [
    'automotive component manufacturer India',
    'automotive machining Bengaluru',
    'CNC automotive parts India',
    'EV automotive components',
    'automotive precision machining',
    'Tier 1 automotive supplier India',
    'automotive CNC machining Bangalore',
    'electric vehicle components manufacturer',
  ],
  badge: 'Automotive & EV Component Manufacturing · Bengaluru',
  hero: {
    heading: 'Automotive Component Manufacturing — Precision CNC Machined Parts',
    subheading:
      'Precision machined components for automotive OEMs, EV programs, and Tier 1/2 suppliers. CNC milling, turning, and assembly for automotive-grade production. Fortius, Bengaluru.',
  },
  ctaText: 'Discuss Automotive Project',
  ctaEmailSubject: 'Automotive Component Enquiry — Fortius',
  whatIs: {
    definition:
      'Automotive component manufacturing encompasses the precision machining of mechanical parts, structural elements, sub-assemblies, and tooling required for passenger vehicles, commercial vehicles, and electric vehicles. Components range from engine and transmission parts to EV battery housings, motor brackets, and chassis components, all manufactured to automotive-grade dimensional and quality standards.',
    importance:
      'Automotive manufacturing operates at high volumes with strict dimensional, fit, and function requirements. Every machined component in a vehicle contributes to performance, safety, and longevity. A reliable CNC machining partner with automotive manufacturing experience — like Fortius — ensures consistent quality, part-to-part repeatability, and the dimensional accuracy that automotive assembly lines demand.',
  },
  applications: [
    'Transmission Housings', 'Engine Brackets', 'EV Motor Mounts',
    'Battery Enclosures', 'Suspension Components', 'Steering Parts',
    'Gearbox Components', 'Drive Shafts', 'Axle Components', 'Brake Parts',
  ],
  highlights: [
    { Icon: Car, title: 'Automotive-Grade Machining', desc: 'Precision CNC machining meeting automotive dimensional and surface finish requirements.' },
    { Icon: Cog, title: 'EV Component Support', desc: 'Motor mounts, battery structural parts, and EV-specific machined components.' },
    { Icon: CheckCircle, title: 'Production Consistency', desc: 'Repeatable dimensions across batch production with systematic inspection.' },
    { Icon: Layers, title: 'Sub-Assembly Capability', desc: 'Multi-part machined assemblies for automotive sub-systems and programs.' },
    { Icon: Settings, title: 'Jigs & Fixtures', desc: 'Automotive production jigs, inspection fixtures, and assembly tooling manufactured.' },
    { Icon: Wrench, title: 'Automotive Material Grades', desc: 'EN8, EN24, alloy steel, aluminium, and other automotive-grade materials machined.' },
  ],
  industriesUsed: [
    { name: 'Passenger Vehicle OEMs', desc: 'Structural and mechanical components for passenger car programs across OEMs.' },
    { name: 'Commercial Vehicles', desc: 'Heavy-duty machined components for trucks, buses, and commercial vehicle programs.' },
    { name: 'Electric Vehicles', desc: 'EV-specific machined parts — motor mounts, battery enclosures, and structural brackets.' },
    { name: 'Two & Three Wheelers', desc: 'Precision components for motorcycle, scooter, and three-wheeler programs.' },
    { name: 'Tier 1 / Tier 2 Suppliers', desc: 'Machined component supply for Tier 1 and Tier 2 automotive suppliers in India.' },
    { name: 'Automotive Tooling', desc: 'Jigs, fixtures, and checking gauges for automotive manufacturing facilities.' },
  ],
  whyFortius: [
    'Established CNC machining facility serving automotive programs since 2017',
    'Experience with both ICE and EV automotive component requirements',
    'CNC milling and turning for the complete range of automotive machined components',
    'Production batch capability with consistent dimensional accuracy',
    'In-house jig and fixture manufacturing for automotive assembly and inspection',
    'Automotive-grade material machining — steel, stainless, aluminium, and alloys',
    'Prototype to production — design validation through volume supply',
    'Located in Chikkabanavara, Bengaluru — strategically positioned for India automotive supply chain',
  ],
  faqs: [
    {
      q: 'Does Fortius manufacture automotive components?',
      a: 'Yes. Fortius manufactures precision CNC machined components for automotive OEMs, EV programs, and Tier 1/2 automotive suppliers — including transmission parts, brackets, housings, shafts, and assembly sub-components.',
    },
    {
      q: 'Can Fortius support EV (electric vehicle) component manufacturing?',
      a: 'Yes. Fortius manufactures components specific to electric vehicle programs — motor mounts, battery enclosure parts, power electronics brackets, drive system components, and EV structural machined parts.',
    },
    {
      q: 'Can Fortius supply automotive Tier 1 and Tier 2 suppliers?',
      a: 'Yes. Fortius supplies precision machined components to automotive Tier 1 and Tier 2 suppliers, meeting the dimensional and quality standards required for automotive supply chains.',
    },
    {
      q: 'What automotive materials can Fortius machine?',
      a: 'Fortius machines EN8, EN24, EN31 alloy steels, mild steel, stainless steel, aluminium alloys, and other automotive-grade materials. Material specification should be stated on drawings.',
    },
    {
      q: 'Can Fortius handle production quantity automotive components?',
      a: 'Yes. Fortius supports batch and production volumes with structured setups, fixturing, and systematic inspection to ensure consistency and dimensional accuracy across production runs.',
    },
    {
      q: 'Does Fortius manufacture automotive jigs and fixtures?',
      a: 'Yes. Fortius manufactures automotive production jigs, assembly fixtures, and inspection gauges for use in automotive manufacturing facilities.',
    },
    {
      q: 'Can Fortius supply prototype automotive parts before production?',
      a: 'Yes. Fortius supports prototype machining for design validation, allowing automotive engineers to verify fit and function before production qualification.',
    },
    {
      q: 'How do I discuss an automotive component project with Fortius?',
      a: 'Contact Fortius at vnyk.hgde@gmail.com or call +91 88804 23666. Share your drawing, material, quantity, and program timeline. The Fortius team will review and respond.',
    },
  ],
  relatedServices: [
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services for automotive components.' },
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision milling for automotive housings, brackets, and structural parts.' },
    { name: 'CNC Turning', href: '/fortius/cnc-turning', desc: 'High-accuracy turning for automotive shafts, bushings, and rotational components.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Automotive jigs and inspection fixtures.' },
  ],
}

export function AutomotiveComponentsPage() {
  return <FortiusServicePage service={service} />
}
