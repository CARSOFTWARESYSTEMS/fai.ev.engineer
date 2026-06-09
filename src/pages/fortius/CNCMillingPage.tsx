import { Cog, Layers, Settings, CheckCircle, Wrench, RotateCcw } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'cnc-milling',
  name: 'CNC Milling',
  title: 'CNC Milling Services | Precision Milled Components | Fortius Bengaluru',
  description:
    'Precision CNC milling services at Fortius Machining Solutions, Bengaluru. Multi-axis milling for complex geometries, pockets, slots, and contoured surfaces for automotive, aerospace, and industrial applications.',
  keywords: [
    'CNC milling services',
    'CNC milling Bengaluru',
    'precision milling India',
    'CNC milled components',
    'multi-axis milling',
    'CNC milling automotive',
    'CNC milling aerospace',
    'precision milling manufacturer',
  ],
  badge: 'CNC Milling Services · Bengaluru',
  hero: {
    heading: 'CNC Milling Services — Precision Milled Components',
    subheading:
      'Multi-axis CNC milling for complex geometries, contoured surfaces, pockets, and precision slots. Fortius Machining Solutions, Peenya, Bengaluru.',
  },
  ctaText: 'Request Milling Quote',
  ctaEmailSubject: 'CNC Milling Enquiry — Fortius',
  whatIs: {
    definition:
      'CNC milling is a machining process that uses rotating cutting tools to remove material from a stationary or indexed workpiece. The cutting tool moves along multiple axes — X, Y, and Z — guided by CNC programs to produce flat surfaces, pockets, slots, holes, and complex 3D contours. Modern CNC milling centres offer 3-axis to 5-axis capability, enabling highly complex part geometries in a single setup.',
    importance:
      'CNC milling is essential for manufacturing components with flat surfaces, pockets, recesses, keyways, and complex profiles that cannot be produced by turning. It is the primary process for manufacturing structural brackets, housings, plates, jigs, fixtures, and precision tools. Accurate CNC milling directly determines how well mating components fit and function in assemblies.',
  },
  applications: [
    'Flat Plates & Panels', 'Housings & Enclosures', 'Brackets & Mounting Plates',
    'Pockets & Recesses', 'Slots & Keyways', 'Complex Profiles',
    'Jig Bodies', 'Fixture Plates', 'Mold Cavities', 'Step Surfaces',
  ],
  highlights: [
    { Icon: Cog, title: 'Multi-Axis Milling', desc: 'CNC milling along X, Y, Z axes for precise flat surfaces, pockets, slots, and complex part geometries.' },
    { Icon: Layers, title: 'Complex Geometry Machining', desc: 'Contoured surfaces, undercuts, and complex profiles machined in controlled setups.' },
    { Icon: Settings, title: 'Precision Tolerances', desc: 'Dimensional accuracy maintained within specification across features and part programs.' },
    { Icon: CheckCircle, title: 'Surface Finish Control', desc: 'Controlled surface finish through tool selection, feed rates, and cutting parameters.' },
    { Icon: Wrench, title: 'Fixture-Supported Setup', desc: 'Purpose-built fixtures ensure part location and repeatability across production batches.' },
    { Icon: RotateCcw, title: 'Material Range', desc: 'Milling of mild steel, alloy steel, stainless steel, aluminium, copper, and brass.' },
  ],
  industriesUsed: [
    { name: 'EV & Automotive', desc: 'Engine components, transmission housings, brackets, and structural parts for automotive programs.' },
    { name: 'Aerospace', desc: 'Structural panels, brackets, ribs, and complex aerospace components requiring tight milling tolerances.' },
    { name: 'Power Electronics', desc: 'Milled enclosures, base plates, heat sink bases, and structural parts for power systems.' },
    { name: 'Electricals', desc: 'Switchgear panels, terminal blocks, transformer parts, and precision machined electrical components.' },
    { name: 'Industrial Machinery', desc: 'Machine frames, slide plates, bed surfaces, and custom industrial machined components.' },
    { name: 'Tooling & Fixtures', desc: 'Jig bodies, fixture plates, mold bases, and precision tool components manufactured by milling.' },
  ],
  whyFortius: [
    'Dedicated CNC milling capability at Peenya, Bengaluru — established since 2017',
    'Multi-axis milling for flat, profiled, and complex workpiece geometries',
    'Tight dimensional tolerances maintained through controlled process parameters',
    'In-house fixture design and manufacture for setup repeatability',
    'Milling of steel, stainless, aluminium, and non-ferrous materials',
    'Prototype and production quantity capability',
    'Quality inspection at machining stages to catch deviations early',
    'Quick response on drawings and technical queries',
  ],
  faqs: [
    {
      q: 'What is CNC milling?',
      a: 'CNC milling is a machining process where rotating cutting tools remove material from a workpiece to produce flat surfaces, pockets, slots, holes, and 3D contoured features. The machine moves the cutting tool (or the workpiece) along programmed axes to achieve the desired geometry.',
    },
    {
      q: 'What types of milling does Fortius perform?',
      a: 'Fortius performs face milling, peripheral milling, pocket milling, slot milling, profile milling, and contour milling. The capability covers a range of part geometries from simple plates to complex housings and brackets.',
    },
    {
      q: 'What materials can be CNC milled at Fortius?',
      a: 'Fortius mills mild steel, EN8 steel, EN24 alloy steel, stainless steel, aluminium alloys, copper, brass, and other engineering metals. Material suitability can be confirmed on enquiry.',
    },
    {
      q: 'What surface finish can be achieved with CNC milling?',
      a: 'Surface finish in CNC milling depends on the cutting tool, feed rate, spindle speed, and material. Fortius can achieve surface finishes from Ra 1.6 µm to Ra 6.3 µm for standard milling operations. Finer finishes can be achieved with appropriate tooling and parameters.',
    },
    {
      q: 'Can Fortius mill complex 3D profiles?',
      a: 'Yes. Fortius can produce profiled and contoured surfaces through CNC milling. The complexity achievable depends on the geometry and program. Specific requirements should be discussed with the team.',
    },
    {
      q: 'Can I get a milled prototype before production?',
      a: 'Yes. Fortius supports prototype milling — single or small batch quantities to validate design and fit before committing to production volumes.',
    },
    {
      q: 'What tolerances can Fortius achieve in CNC milling?',
      a: 'General dimensional tolerances for CNC milling at Fortius are in the range of ±0.02 mm to ±0.05 mm. Tighter tolerances are achievable for specific critical features. Tolerance requirements must be clearly specified on drawings.',
    },
    {
      q: 'How do I request a CNC milling quote from Fortius?',
      a: 'Email your drawing (PDF/DXF), material, quantity, and tolerance requirements to vnyk.hgde@gmail.com or call +91 88804 23666. The team will review and provide a quote.',
    },
  ],
  relatedServices: [
    { name: 'CNC Turning', href: '/fortius/cnc-turning', desc: 'High-accuracy turning for shafts, flanges, and rotational components.' },
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services covering milling, turning, and component manufacture.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Custom jig and fixture manufacturing for production and inspection.' },
    { name: 'Press Tools', href: '/fortius/press-tools', desc: 'Precision press tool manufacture for sheet metal forming.' },
  ],
}

export function CNCMillingPage() {
  return <FortiusServicePage service={service} />
}
