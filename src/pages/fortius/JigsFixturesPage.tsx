import { Wrench, Cog, CheckCircle, Layers, Settings, RotateCcw } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'jigs-and-fixtures',
  name: 'Jigs & Fixtures',
  title: 'Jigs and Fixtures Manufacturing | Fortius Machining Solutions Bengaluru',
  description:
    'Precision jigs and fixtures manufacturing at Fortius Machining Solutions, Bengaluru. Custom jig bodies, fixture plates, assembly jigs, and inspection fixtures for automotive, aerospace, and industrial manufacturing.',
  keywords: [
    'jigs and fixtures manufacturer India',
    'jig manufacturer Bengaluru',
    'fixtures manufacturer India',
    'inspection fixtures manufacturer',
    'assembly jigs India',
    'precision fixtures manufacturing',
    'CNC machined fixtures',
    'tooling manufacturer Bengaluru',
  ],
  badge: 'Jigs & Fixtures Manufacturing · Bengaluru',
  hero: {
    heading: 'Jigs & Fixtures Manufacturing — Precision Tooling for Production',
    subheading:
      'Custom jig and fixture design and manufacture for production accuracy, assembly support, and inspection operations. Fortius Machining Solutions, Chikkabanavara, Bengaluru.',
  },
  ctaText: 'Request Fixture Quote',
  ctaEmailSubject: 'Jigs & Fixtures Enquiry — Fortius',
  whatIs: {
    definition:
      'Jigs are workholding and guiding devices that locate a workpiece and guide cutting or drilling tools during machining, ensuring consistent hole positions and feature locations across all parts. Fixtures locate and hold a workpiece during machining or assembly without guiding the tool. Both are precision-machined tools that underpin accuracy, repeatability, and quality in manufacturing and inspection operations.',
    importance:
      'In any volume manufacturing environment, jigs and fixtures are the invisible foundation of quality. They eliminate variability by ensuring every component is located and processed in exactly the same position. Without precision jigs and fixtures, dimensional consistency is impossible to achieve at scale — leading to assembly problems, quality escapes, and rework. Fortius manufactures these critical tools to the accuracy that production operations demand.',
  },
  applications: [
    'Drill Jigs', 'Assembly Fixtures', 'Inspection Gauges',
    'Welding Fixtures', 'Machining Fixtures', 'Checking Fixtures',
    'CMM Fixtures', 'Locating Fixtures', 'Clamping Fixtures', 'Modular Fixture Plates',
  ],
  highlights: [
    { Icon: Wrench, title: 'Custom Jig Manufacturing', desc: 'Drill jigs, locating jigs, and machining jigs manufactured to customer drawing specifications.' },
    { Icon: Cog, title: 'Precision Fixture Plates', desc: 'Fixture body and base plate machining with precise location features and datum surfaces.' },
    { Icon: CheckCircle, title: 'Inspection Fixtures', desc: 'Checking fixtures and gauges for dimensional verification of machined and formed components.' },
    { Icon: Layers, title: 'Assembly Jigs', desc: 'Assembly jigs for automotive, aerospace, and industrial sub-assembly operations.' },
    { Icon: Settings, title: 'Welding Fixtures', desc: 'Fixtures for welding operations that maintain component position and prevent distortion.' },
    { Icon: RotateCcw, title: 'Material Selection', desc: 'Jig and fixture bodies in mild steel, EN8 steel, hardened steel, and aluminium as required.' },
  ],
  industriesUsed: [
    { name: 'Automotive Manufacturing', desc: 'Production jigs, assembly fixtures, and inspection gauges for automotive component manufacturing.' },
    { name: 'Aerospace', desc: 'Assembly jigs and inspection fixtures for aerospace structural and mechanical assembly programs.' },
    { name: 'Sheet Metal Fabrication', desc: 'Welding fixtures and formed part checking gauges for sheet metal and fabrication operations.' },
    { name: 'Industrial Machinery', desc: 'Machining fixtures, assembly jigs, and production tooling for industrial equipment manufacturers.' },
    { name: 'Defence Manufacturing', desc: 'Precision jigs and fixtures for defence component manufacturing and inspection.' },
    { name: 'Electronics Manufacturing', desc: 'PCB assembly fixtures, component locating jigs, and precision manufacturing tooling for electronics.' },
  ],
  whyFortius: [
    'In-house CNC machining capability for precision jig and fixture manufacture',
    'Custom jig and fixture design to customer drawings or conceptual requirements',
    'Both ferrous and non-ferrous materials machined for jig and fixture bodies',
    'Drill jigs, assembly fixtures, inspection fixtures, and welding fixtures manufactured',
    'Precision location features — pins, bushings, datum pads — machined accurately',
    'Short lead times on tooling compared to larger tooling manufacturers',
    'Rework and modification of existing jigs and fixtures available',
    'Experience serving automotive, aerospace, and industrial tooling requirements',
  ],
  faqs: [
    {
      q: 'What is the difference between a jig and a fixture?',
      a: 'A jig locates a workpiece AND guides the cutting tool — for example, a drill jig guides the drill to the correct hole position. A fixture only locates and holds the workpiece — the machine or operator positions the tool independently. Both are precision workholding tools that ensure consistency in manufacturing.',
    },
    {
      q: 'What types of jigs and fixtures does Fortius manufacture?',
      a: 'Fortius manufactures drill jigs, machining fixtures, assembly jigs, welding fixtures, inspection (checking) fixtures, CMM fixtures, locating fixtures, clamping fixtures, and modular fixture plates for automotive, aerospace, and industrial applications.',
    },
    {
      q: 'What materials are used for jigs and fixtures?',
      a: 'Jig and fixture bodies at Fortius are typically manufactured from mild steel, EN8 steel, or hardened steel for production tooling. Aluminium is used where weight is a consideration. Hardened bushings and inserts are incorporated as required.',
    },
    {
      q: 'Can Fortius design custom jigs from concept?',
      a: 'Fortius manufactures jigs and fixtures from customer-supplied drawings. For conceptual tooling where a full drawing does not exist, design requirements should be discussed with the Fortius team on enquiry.',
    },
    {
      q: 'What is the typical lead time for jigs and fixtures?',
      a: 'Lead time for jigs and fixtures depends on complexity and current workload. Simple fixtures can be manufactured in 1–2 weeks; complex multi-component jigs may take 3–6 weeks. Lead time should be discussed on enquiry.',
    },
    {
      q: 'Does Fortius manufacture inspection and checking fixtures?',
      a: 'Yes. Fortius manufactures checking fixtures and inspection gauges for dimensional verification of machined, stamped, and formed components — commonly used in automotive and aerospace quality control.',
    },
    {
      q: 'Can Fortius modify or repair existing jigs and fixtures?',
      a: 'Yes. Fortius can modify or repair existing jigs and fixtures — including re-machining worn features, adding new locating elements, or adapting tooling for revised component designs.',
    },
    {
      q: 'How do I get a jig or fixture quote from Fortius?',
      a: 'Send your jig or fixture drawing (or a description of the requirement), the component it is intended to hold, quantity, and material preference to vnyk.hgde@gmail.com or call +91 88804 23666.',
    },
  ],
  relatedServices: [
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services for all component types.' },
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision milling for fixture bodies, plates, and tooling components.' },
    { name: 'Press Tools', href: '/fortius/press-tools', desc: 'Press tool manufacture for sheet metal forming and stamping.' },
    { name: 'Aerospace Components', href: '/fortius/aerospace-components', desc: 'Aerospace assembly jigs and structural component manufacturing.' },
  ],
}

export function JigsFixturesPage() {
  return <FortiusServicePage service={service} />
}
