import { Hammer, Cog, CheckCircle, Layers, Settings, Wrench } from 'lucide-react'
import { FortiusServicePage } from '../../components/fortius/FortiusServicePage'
import type { FortiusService } from '../../components/fortius/FortiusServicePage'

const service: FortiusService = {
  slug: 'press-tools',
  name: 'Press Tools',
  title: 'Press Tool Manufacturing Services | Fortius Machining Solutions Bengaluru',
  description:
    'Precision press tool manufacturing at Fortius Machining Solutions, Bengaluru. CNC machined blanking tools, forming dies, progressive dies, and sheet metal tooling for automotive, electrical, and industrial applications.',
  keywords: [
    'press tool manufacturer India',
    'press tool manufacturing Bengaluru',
    'sheet metal tooling India',
    'die manufacturing India',
    'blanking tool manufacturer',
    'forming die manufacturer',
    'progressive die manufacturer India',
    'tooling solutions Bengaluru',
  ],
  badge: 'Press Tool Manufacturing · Bengaluru',
  hero: {
    heading: 'Press Tool Manufacturing — Precision Sheet Metal Tooling',
    subheading:
      'CNC machined blanking tools, forming dies, compound dies, and progressive dies for sheet metal stamping and forming operations. Fortius Machining Solutions, Bengaluru.',
  },
  ctaText: 'Request Tooling Quote',
  ctaEmailSubject: 'Press Tool Enquiry — Fortius',
  whatIs: {
    definition:
      'Press tools are precision tooling assemblies used in power presses to cut, blank, pierce, bend, form, or draw sheet metal into required shapes and sizes. A press tool set typically consists of a punch (upper tool) and a die (lower tool), machined to precise dimensions. When the press closes, the punch enters the die, performing the required sheet metal operation. Press tools range from simple single-operation blanking dies to complex multi-stage progressive dies.',
    importance:
      'Press tools are the foundation of high-volume sheet metal component production. The accuracy of the press tool directly determines the dimensional accuracy of every component stamped or formed. A well-designed and precisely machined press tool produces consistent parts with minimal setup time, minimal scrap, and long tool life. Fortius manufactures press tools with the precision that production requirements demand.',
  },
  applications: [
    'Blanking Dies', 'Piercing Tools', 'Forming Dies',
    'Bending Tools', 'Compound Dies', 'Progressive Dies',
    'Drawing Dies', 'Trimming Tools', 'Embossing Tools', 'Coining Tools',
  ],
  highlights: [
    { Icon: Hammer, title: 'Blanking & Piercing Tools', desc: 'Blanking and piercing dies machined to close tolerances for clean, accurate sheet metal cutouts.' },
    { Icon: Cog, title: 'Forming & Bending Dies', desc: 'Sheet metal forming, bending, and drawing dies for component shaping operations.' },
    { Icon: CheckCircle, title: 'Progressive Die Capability', desc: 'Multi-stage progressive die tooling for high-volume sheet metal production.' },
    { Icon: Layers, title: 'Die Set Components', desc: 'Die plates, punch plates, stripper plates, guide pillars, and bushings machined accurately.' },
    { Icon: Settings, title: 'Hardened Tool Steel', desc: 'Working components machined in D2, H13, EN31, and other tool steel grades as required.' },
    { Icon: Wrench, title: 'Tool Assembly Support', desc: 'Assembly, tryout, and commissioning support for press tool sets.' },
  ],
  industriesUsed: [
    { name: 'Automotive Sheet Metal', desc: 'Blanking tools, forming dies, and progressive dies for automotive body and structural components.' },
    { name: 'Electrical Equipment', desc: 'Precision dies for laminations, contacts, terminals, and electrical component stamping.' },
    { name: 'Consumer Electronics', desc: 'Small-part blanking and forming dies for electronic hardware and sheet metal enclosures.' },
    { name: 'HVAC & Appliances', desc: 'Forming and blanking tools for HVAC panels, brackets, and appliance sheet metal components.' },
    { name: 'Industrial Fabrication', desc: 'Sheet metal cutting and forming tooling for industrial and engineering fabrication operations.' },
    { name: 'EV Manufacturing', desc: 'Tooling for EV battery tray components, structural brackets, and sheet metal EV parts.' },
  ],
  whyFortius: [
    'Precision CNC machining for die plates, punch plates, and all press tool components',
    'Experience in blanking, forming, compound, and progressive die manufacturing',
    'Hardened tool steel machining — D2, EN31, H13, and other tool grades',
    'Die set component accuracy: die plates, stripper plates, guide elements machined consistently',
    'Assembly and tryout support for press tool commissioning',
    'Repair and modification of worn or damaged press tool components',
    'Competitive lead times for tooling projects in Bengaluru',
    'Automotive and industrial tooling experience since 2017',
  ],
  faqs: [
    {
      q: 'What is a press tool?',
      a: 'A press tool is a precision tooling assembly used in a mechanical or hydraulic press to cut, punch, blank, pierce, bend, form, or draw sheet metal. It consists of a punch and die set, guide elements, and clamping/stripper components — all machined to precise tolerances.',
    },
    {
      q: 'What types of press tools does Fortius manufacture?',
      a: 'Fortius manufactures blanking dies, piercing tools, compound dies (blanking + piercing in one stroke), forming dies, bending tools, drawing dies, trimming tools, and progressive die components.',
    },
    {
      q: 'What sheet metal materials can Fortius press tools work with?',
      a: 'Fortius press tools can be designed for cold-rolled steel (CRC), stainless steel, aluminium, copper, brass, and other common sheet metal materials. The tool material and clearances are specified based on the workpiece material.',
    },
    {
      q: 'Can Fortius manufacture progressive dies?',
      a: 'Yes. Fortius manufactures progressive die components — punch plates, die plates, stripper plates, and guide elements — for multi-stage progressive die sets used in high-volume sheet metal production.',
    },
    {
      q: 'What tool steel grades does Fortius machine for press tools?',
      a: 'Fortius machines working components in D2 (high chromium die steel), EN31 (bearing steel), H13 (hot work tool steel), and other grades as specified. Material selection depends on the production volume, sheet material, and required tool life.',
    },
    {
      q: 'What is the typical lead time for press tool manufacture?',
      a: 'Press tool lead time depends on complexity — from 2–3 weeks for simple blanking tools to 6–10 weeks for complex progressive die sets. Lead time should be discussed on enquiry with your drawing and specification.',
    },
    {
      q: 'Does Fortius provide press tool repair services?',
      a: 'Yes. Fortius repairs and refurbishes worn press tools — including re-machining worn punch and die edges, replacing damaged components, and modifying tooling for design changes.',
    },
    {
      q: 'How do I get a press tool quote from Fortius?',
      a: 'Send your component drawing, material, sheet thickness, production quantity, and any existing tool layout or concept to vnyk.hgde@gmail.com or call +91 88804 23666. The Fortius team will review and provide a tooling quote.',
    },
  ],
  relatedServices: [
    { name: 'CNC Machining', href: '/fortius/cnc-machining', desc: 'Complete CNC machining services for all tooling components.' },
    { name: 'Jigs & Fixtures', href: '/fortius/jigs-and-fixtures', desc: 'Custom jig and fixture manufacture for production and inspection.' },
    { name: 'CNC Milling', href: '/fortius/cnc-milling', desc: 'Precision milling for die plates, punch plates, and tooling components.' },
    { name: 'Automotive Components', href: '/fortius/automotive-components', desc: 'Automotive component manufacturing including sheet metal parts.' },
  ],
}

export function PressToolsPage() {
  return <FortiusServicePage service={service} />
}
