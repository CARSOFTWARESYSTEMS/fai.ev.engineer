import { RotateCcw, Cog, Layers, Settings, CheckCircle, Wrench } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'cnc-turning',
  name: 'CNC Turning',
  title: 'CNC Turning Services | Precision Turned Components | Fortius Bengaluru',
  description:
    'Precision CNC turning services at Fortius Machining Solutions, Bengaluru. High-accuracy turning for shafts, bushings, flanges, and rotational components in steel, aluminium, and engineering metals.',
  keywords: [
    'CNC turning services',
    'CNC turned components',
    'precision turning India',
    'CNC turning Bengaluru',
    'turned parts manufacturer',
    'CNC shaft turning',
    'precision turned parts',
    'lathe machining services India',
  ],
  badge: 'CNC Turning Services · Bengaluru',
  hero: {
    heading: 'CNC Turning Services — Precision Turned Components',
    subheading:
      'High-accuracy CNC turning for shafts, bushings, flanges, and rotational components across automotive, aerospace, and industrial applications. Fortius, Bengaluru.',
  },
  ctaText: 'Request Turning Quote',
  ctaEmailSubject: 'CNC Turning Enquiry — Fortius',
  whatIs: {
    definition:
      'CNC turning is a machining process where a workpiece rotates while a stationary or traversing cutting tool removes material to produce cylindrical, conical, or profiled shapes. CNC lathes and turning centres execute programmed toolpaths to produce accurate diameters, lengths, tapers, threads, grooves, and undercuts in a controlled and repeatable manner.',
    importance:
      'CNC turning is the primary manufacturing method for all rotational and axisymmetric components — shafts, bushings, pins, spindles, and flanges. These components are found in every mechanical assembly. Dimensional accuracy in turning directly affects bearing fits, gear mesh, and assembly clearances. Precision turning at Fortius ensures components meet engineering requirements first time.',
  },
  applications: [
    'Shafts & Spindles', 'Bushings & Sleeves', 'Flanges & Collars',
    'Pins & Dowels', 'Threaded Components', 'Pulleys & Sprockets',
    'Spacers & Standoffs', 'Turned Housings', 'Valve Bodies', 'Coupling Hubs',
  ],
  highlights: [
    { Icon: RotateCcw, title: 'CNC Lathe Turning', desc: 'Accurate OD and ID turning for shafts, bushings, and all rotational components.' },
    { Icon: Cog, title: 'Thread Cutting', desc: 'Internal and external threading — metric, UNC, UNF, and custom thread forms.' },
    { Icon: Layers, title: 'Taper & Profile Turning', desc: 'Tapers, chamfers, radii, and profiled OD/ID forms produced to drawing specification.' },
    { Icon: Settings, title: 'Groove & Undercut Machining', desc: 'Grooves for O-ring seating, snap rings, keyways, and precision undercuts.' },
    { Icon: CheckCircle, title: 'Diameter Control', desc: 'Tight diameter tolerances maintained with in-process measurement and tool compensation.' },
    { Icon: Wrench, title: 'Multi-Material Turning', desc: 'Turning of mild steel, alloy steel, stainless steel, aluminium, brass, and copper alloys.' },
  ],
  industriesUsed: [
    { name: 'EV & Automotive', desc: 'Shafts, bushings, bearing housings, and drive system components for automotive programs.' },
    { name: 'Aerospace', desc: 'Turned structural pins, fasteners, bushings, and precision rotational aerospace components.' },
    { name: 'Power Electronics', desc: 'Motor shafts, drive pins, and precision rotational parts for power conversion systems.' },
    { name: 'Electricals', desc: 'Turned contacts, terminals, pins, and electromechanical components for electrical equipment.' },
    { name: 'Industrial Equipment', desc: 'Shafts, pulleys, couplings, and spindles for industrial machinery and capital equipment.' },
    { name: 'Pumps & Valves', desc: 'Valve bodies, pump shafts, impeller hubs, and precision turned fluid system components.' },
  ],
  whyFortius: [
    'CNC turning capability established since 2017 in Chikkabanavara, Bengaluru',
    'Accurate diameter and length control — tight tolerances maintained consistently',
    'Threading, grooving, taper turning, and profiling in a single setup where possible',
    'Turning of steel, stainless, aluminium, brass, and copper alloys',
    'Prototype to production volume turning capability',
    'In-process measurement to verify dimensions before final finishing',
    'Quick turnaround on drawings and quotations',
    'Export supply to domestic and international customers',
  ],
  faqs: [
    {
      q: 'What is CNC turning?',
      a: 'CNC turning is a machining process where a workpiece rotates on a lathe while a cutting tool traverses along programmed paths to remove material and produce cylindrical, tapered, threaded, and profiled shapes. It is the primary process for manufacturing shafts, bushings, flanges, and all rotationally symmetric components.',
    },
    {
      q: 'What turned components does Fortius manufacture?',
      a: 'Fortius turns shafts, spindles, bushings, sleeves, pins, dowels, flanges, collars, threaded components, spacers, pulleys, coupling hubs, and custom turned parts for automotive, aerospace, power electronics, and industrial applications.',
    },
    {
      q: 'What diameter range can Fortius turn?',
      a: 'The diameter range for CNC turning at Fortius can be confirmed on enquiry based on the specific component and material. Typical CNC lathes at production facilities handle a range from small diameter pins to larger flanges and housings.',
    },
    {
      q: 'What materials can be CNC turned at Fortius?',
      a: 'Fortius turns mild steel, EN8, EN24, EN31 alloy steels, stainless steel, aluminium alloys, brass, copper, and other engineering metals. Material selection should be specified on the drawing or enquiry.',
    },
    {
      q: 'Can Fortius cut threads in turned components?',
      a: 'Yes. Fortius cuts external and internal threads — metric (M series), UNC, UNF, and custom thread forms. Thread pitch, class of fit, and tolerances must be specified on the drawing.',
    },
    {
      q: 'Can I combine turning with milling at Fortius?',
      a: 'Yes. Components requiring both turning and milling operations can be machined at Fortius — the two operations are coordinated in production to deliver complete machined components.',
    },
    {
      q: 'What tolerances can Fortius achieve in CNC turning?',
      a: 'Fortius achieves dimensional tolerances generally in the range of ±0.01 mm to ±0.05 mm for turned diameters and lengths. Tighter tolerances for bearing fits and precision interfaces can be achieved. Tolerances must be clearly specified on drawings.',
    },
    {
      q: 'How do I request a CNC turning quote from Fortius?',
      a: 'Send your drawing (PDF or DXF), material specification, quantity, and tolerances to vnyk.hgde@gmail.com or call +91 88804 23666. The Fortius team will review your requirement and respond with a quote.',
    },
  ],
  relatedServices: [
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision multi-axis milling for flat surfaces, pockets, and complex profiles.' },
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services including milling, turning, and component manufacture.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Custom jig and fixture manufacturing for production and inspection.' },
    { name: 'Automotive Components', href: '/fortius/automotive-components', desc: 'Precision component manufacturing for automotive and EV programs.' },
  ],
}

export function CNCTurningPage() {
  return <FortiusServicePage service={service} />
}
