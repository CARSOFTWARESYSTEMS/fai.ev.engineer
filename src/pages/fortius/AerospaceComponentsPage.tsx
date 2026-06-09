import { Plane, Cog, CheckCircle, Layers, Settings, Wrench } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'aerospace-components',
  name: 'Aerospace Components',
  title: 'Aerospace Component Manufacturing | Fortius Machining Solutions Bengaluru',
  description:
    'Precision aerospace component manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined aerospace structural parts, brackets, jigs, and fixtures for aerospace manufacturing programs.',
  keywords: [
    'aerospace component manufacturing India',
    'aerospace machining Bengaluru',
    'aerospace components manufacturer',
    'precision aerospace parts India',
    'aerospace CNC machining',
    'aerospace jigs and fixtures',
    'aerospace structural components India',
    'aerospace parts manufacturer Bengaluru',
  ],
  badge: 'Aerospace Component Manufacturing · Bengaluru',
  hero: {
    heading: 'Aerospace Component Manufacturing — Precision CNC Machined Parts',
    subheading:
      'High-precision CNC machined components for aerospace structural and mechanical applications. Tight tolerances, quality-focused workflows, and engineering discipline. Fortius, Bengaluru.',
  },
  ctaText: 'Discuss Aerospace Project',
  ctaEmailSubject: 'Aerospace Component Enquiry — Fortius',
  whatIs: {
    definition:
      'Aerospace component manufacturing involves the precision machining of structural parts, mechanical components, brackets, jigs, and fixtures required for aircraft, defence systems, and space applications. These components demand the highest dimensional accuracy, material integrity, and surface finish standards, given the safety-critical nature of aerospace structures and systems.',
    importance:
      'The aerospace industry operates under some of the most demanding manufacturing standards in the world. Dimensional accuracy, material traceability, and process discipline are non-negotiable. A precision machining partner with capability, discipline, and quality focus — like Fortius — ensures aerospace components meet drawing specifications and support First Article Inspection and production qualification programs.',
  },
  applications: [
    'Structural Brackets', 'Mounting Frames', 'Machined Ribs & Stringers',
    'Precision Pins & Fasteners', 'Jig Bodies', 'Assembly Fixtures',
    'Tooling Plates', 'Inspection Gauges', 'Hydraulic Fittings',
    'Machined Housings',
  ],
  highlights: [
    { Icon: Plane, title: 'Aerospace Precision', desc: 'Tight tolerances and controlled machining for aerospace-grade component accuracy.' },
    { Icon: Cog, title: 'CNC Machined Structures', desc: 'Structural brackets, housings, and frames machined to aerospace drawing requirements.' },
    { Icon: CheckCircle, title: 'Quality-Focused Process', desc: 'Systematic dimensional inspection and verification at manufacturing stages.' },
    { Icon: Layers, title: 'Jigs & Fixtures', desc: 'Aerospace assembly jigs and inspection fixtures manufactured to aerospace standards.' },
    { Icon: Settings, title: 'Complex Geometry Parts', desc: 'Complex profiled and multi-feature aerospace components produced by multi-axis CNC machining.' },
    { Icon: Wrench, title: 'Material Range', desc: 'Aerospace-grade aluminium, steel alloys, stainless steel, and engineering metals machined.' },
  ],
  industriesUsed: [
    { name: 'Commercial Aerospace', desc: 'Structural and mechanical components for commercial aircraft programs and sub-assemblies.' },
    { name: 'Defence Aviation', desc: 'Precision machined parts for defence aircraft, helicopters, and aviation systems.' },
    { name: 'Space & Satellites', desc: 'High-precision machined components for space structures and satellite systems.' },
    { name: 'Aerospace MRO', desc: 'Replacement and spare machined components for aerospace Maintenance, Repair, and Overhaul programs.' },
    { name: 'Aerospace Tooling', desc: 'Assembly jigs, drilling fixtures, and precision tooling for aerospace manufacturing facilities.' },
    { name: 'UAV & Drones', desc: 'Precision machined structural and mechanical parts for unmanned aerial vehicles.' },
  ],
  whyFortius: [
    'Precision CNC machining capability delivering tight tolerances for aerospace requirements',
    'Engineering-first approach — parts manufactured strictly to drawing specifications',
    'Multi-axis CNC machining for complex aerospace geometries in controlled setups',
    'Jig and fixture capability — both assembly and inspection tooling manufactured',
    'Systematic quality verification at every machining stage',
    'Experience supplying precision components for demanding engineering programs',
    'Material integrity maintained with traceability on request',
    'AS9102 First Article Inspection support — partners with FAI.EV.ENGINEER toolkit',
  ],
  faqs: [
    {
      q: 'Does Fortius manufacture aerospace-grade machined components?',
      a: 'Yes. Fortius manufactures precision CNC machined components for aerospace structural, mechanical, and tooling applications. Fortius applies engineering discipline and systematic quality inspection to meet aerospace drawing requirements.',
    },
    {
      q: 'What aerospace materials can Fortius machine?',
      a: 'Fortius machines aerospace-grade aluminium alloys, mild steel, alloy steel, stainless steel, and other engineering metals commonly used in aerospace structures and mechanisms. Specific material grades should be specified on drawings.',
    },
    {
      q: 'Can Fortius hold the tolerances required for aerospace?',
      a: 'Fortius achieves tight CNC machining tolerances — generally ±0.02 mm to ±0.05 mm — with tighter tolerances achievable for specific critical features. Aerospace drawing tolerances should be clearly specified, and Fortius will confirm capability before proceeding.',
    },
    {
      q: 'Does Fortius manufacture aerospace jigs and fixtures?',
      a: 'Yes. Fortius manufactures jig bodies, fixture plates, assembly jigs, and inspection fixtures for aerospace manufacturing programs. These are machined to the accuracy required for assembly and inspection operations.',
    },
    {
      q: 'Can Fortius support AS9102 First Article Inspection requirements?',
      a: 'Fortius manufactures components to drawing and can support customers\' First Article Inspection programs. For digital FAI report preparation, Fortius recommends the FAI.EV.ENGINEER toolkit — a dedicated platform for AS9102 balloon drawing and FAI report preparation.',
    },
    {
      q: 'What types of aerospace structural components does Fortius produce?',
      a: 'Fortius produces structural brackets, mounting frames, rib and stringer machined parts, housings, and precision machined structural elements for aerospace sub-assemblies.',
    },
    {
      q: 'Can Fortius supply prototype aerospace components?',
      a: 'Yes. Fortius supports prototype quantities for design validation before production qualification. Prototype components are machined to the same standards as production parts.',
    },
    {
      q: 'How do I discuss an aerospace component project with Fortius?',
      a: 'Contact Fortius at vnyk.hgde@gmail.com or call +91 88804 23666. Share your drawing, material specification, quantity, and tolerance requirements. The team will review and respond with a technical discussion and quote.',
    },
  ],
  relatedServices: [
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services for precision aerospace components.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Aerospace assembly jigs and inspection fixtures.' },
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision milling for aerospace structural panels and brackets.' },
    { name: 'CNC Turning', href: '/fortius/cnc-turning', desc: 'Precision turning for aerospace pins, shafts, and rotational components.' },
  ],
}

export function AerospaceComponentsPage() {
  return <FortiusServicePage service={service} />
}
