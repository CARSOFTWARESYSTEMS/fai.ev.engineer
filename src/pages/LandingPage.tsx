import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Target,
  Table2,
  Download,
  Cloud,
  Scan,
  Upload,
  Circle,
  ClipboardList,
  FileOutput,
  HardDrive,
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Wrench,
  Plane,
  Shield,
  Microscope,
  Users,
  ExternalLink,
  Factory,
  Cpu,
  Code2,
} from 'lucide-react'
import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <FileText className="w-6 h-6 text-primary" />,
    title: 'PDF Drawing Viewer',
    description:
      'Open engineering drawing PDFs directly in the browser. Zoom, pan, and navigate multi-page drawings without any downloads.',
  },
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: 'Manual Ballooning',
    description:
      'Place, move, and renumber balloon callouts on your drawings with precision. Add leader lines to any feature.',
  },
  {
    icon: <Table2 className="w-6 h-6 text-primary" />,
    title: 'Feature Table',
    description:
      'Build a structured characteristic table with feature number, nominal, tolerances, type, and comments — all editable in place.',
  },
  {
    icon: <Download className="w-6 h-6 text-primary" />,
    title: 'AS9102 Form 3 Export',
    description:
      'Export your characteristic data directly to AS9102 Form 3 format in Excel or CSV, ready for your FAI package.',
  },
  {
    icon: <Cloud className="w-6 h-6 text-primary" />,
    title: 'Google Drive Save/Load',
    description:
      'Save and reload your complete project — drawing, balloons, and table — from your own Google Drive account.',
  },
  {
    icon: <Scan className="w-6 h-6 text-primary" />,
    title: 'OCR Assisted Extraction',
    description:
      'Automatic dimension and tolerance extraction from drawing text. Reduces manual entry by recognizing feature data from the PDF.',
    badge: 'Available in Beta',
    badgeColor: 'bg-primary/10 text-primary',
  },
]

// ─── Industry badges ──────────────────────────────────────────────────────────

const industries = [
  { icon: <Factory className="w-4 h-4" />, label: 'MSME Manufacturers' },
  { icon: <Microscope className="w-4 h-4" />, label: 'Precision Engineering Companies' },
  { icon: <Plane className="w-4 h-4" />, label: 'Aerospace Suppliers' },
  { icon: <Cpu className="w-4 h-4" />, label: 'Battery Manufacturers' },
  { icon: <Wrench className="w-4 h-4" />, label: 'Testing & Validation Teams' },
  { icon: <Users className="w-4 h-4" />, label: 'Quality Engineers' },
]

// ─── Who Benefits ─────────────────────────────────────────────────────────────

const whoBenefits = [
  {
    icon: <Factory className="w-6 h-6 text-primary" />,
    title: 'MSME Manufacturers',
    description:
      'Prepare balloon drawings and manufacturing quality documentation without expensive enterprise quality software.',
  },
  {
    icon: <Microscope className="w-6 h-6 text-primary" />,
    title: 'Precision Engineering Companies',
    description:
      'Manage critical dimensions, tolerances, and drawing characteristics efficiently in a structured inspection workflow.',
  },
  {
    icon: <Plane className="w-6 h-6 text-primary" />,
    title: 'Aerospace Suppliers',
    description:
      'Support AS9102-style quality documentation and first article inspection workflows for aerospace programs.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-primary" />,
    title: 'Battery Manufacturers',
    description:
      'Maintain traceability between engineering drawings and inspection records across manufacturing quality workflows.',
  },
  {
    icon: <Wrench className="w-6 h-6 text-primary" />,
    title: 'Testing & Validation Teams',
    description:
      'Link drawing requirements with verification and validation activities for complete inspection traceability.',
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: 'Quality Engineers & FAI Coordinators',
    description:
      'Reduce spreadsheet effort and standardize AS9102 documentation with a consistent quality inspection workflow.',
  },
]

// ─── Future Vision ────────────────────────────────────────────────────────────

const futureItems = [
  'OCR-assisted characteristic extraction from drawing text',
  'Automatic dimension recognition',
  'GD&T symbol recognition and parsing',
  'Drawing revision comparison',
  'Inspection workflow automation',
]

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    icon: <Upload className="w-6 h-6" />,
    title: 'Upload Drawing PDF',
    description: 'Select your engineering drawing PDF. It opens directly in your browser — nothing is uploaded to our servers.',
  },
  {
    number: '02',
    icon: <Circle className="w-6 h-6" />,
    title: 'Add Balloons',
    description: 'Click on the drawing to place numbered balloon callouts on each feature. Drag to reposition, click to renumber.',
  },
  {
    number: '03',
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Review Characteristics',
    description: 'Edit nominal dimensions, tolerances, units, feature type, and comments in the linked characteristic table.',
  },
  {
    number: '04',
    icon: <FileOutput className="w-6 h-6" />,
    title: 'Export AS9102 Form 3',
    description: 'Download your completed characteristic accountability table as an AS9102 Form 3 Excel or CSV file.',
  },
]

// ─── Why Teams Choose ────────────────────────────────────────────────────────

const whyItems = [
  { text: 'Reduce manual drawing ballooning effort by up to 80%' },
  { text: 'Keep all characteristics organized in one linked table' },
  { text: 'Prepare AS9102 Form 3 faster than any spreadsheet' },
  { text: 'Work directly in the browser — no software to install' },
  { text: 'Save and reload projects with Google Drive at any time' },
  { text: 'Manage multiple FAI projects consistently across programs' },
]

// ─── Pricing ─────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Trial',
    price: 'Free',
    period: '7 days',
    description: 'Full access to all features. No credit card required.',
    cta: 'Start Free Trial',
    featured: false,
    features: [
      'All FAI toolkit features',
      'PDF drawing viewer',
      'Manual ballooning',
      'Feature table',
      'AS9102 Form 3 export',
      'Google Drive save/load',
    ],
  },
  {
    name: 'Monthly',
    price: '$29',
    period: 'per month',
    description: 'Full access, cancel any time.',
    cta: 'Get Started',
    featured: true,
    features: [
      'Everything in Trial',
      'Unlimited projects',
      'Priority support',
      'OCR extraction (Beta)',
      'Form 1 & Form 2 (coming soon)',
    ],
  },
  {
    name: 'Annual',
    price: '$299',
    period: 'per year',
    description: 'Save $49 vs monthly. Best for continuous use.',
    cta: 'Get Started',
    featured: false,
    badge: 'Save $49',
    features: [
      'Everything in Monthly',
      'Bulk project export',
      'Team accounts (coming soon)',
      'Admin portal (coming soon)',
      'Dedicated support',
    ],
  },
]

// ─── Trust ───────────────────────────────────────────────────────────────────

const trustItems = [
  {
    icon: <HardDrive className="w-6 h-6 text-primary" />,
    title: 'Browser-First Processing',
    description: 'PDF rendering happens entirely in your browser. Your drawing files never leave your machine.',
  },
  {
    icon: <Cloud className="w-6 h-6 text-primary" />,
    title: 'Google Drive Storage',
    description: 'Projects are saved to your own Google Drive account. You own your data — we never store your drawings.',
  },
  {
    icon: <Lock className="w-6 h-6 text-primary" />,
    title: 'User-Controlled Projects',
    description: 'Export, delete, and move your project data at any time. No vendor lock-in.',
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: 'Secure Authentication',
    description: 'Sign in with Google or email. Industry-standard auth with Firebase Authentication.',
  },
]

// ─── Partners ────────────────────────────────────────────────────────────────

const partners = [
  {
    name: 'FORTIUS MACHINING SOLUTIONS Private Limited',
    type: 'Manufacturing Partner',
    description:
      'Precision machining and manufacturing expertise supporting real-world FAI workflow validation and AS9102 process requirements.',
    icon: <Factory className="w-6 h-6 text-primary" />,
    href: 'https://www.google.com/maps/place/Fortius+Machining+Solutions+Pvt.+Ltd./@13.1029312,77.5020785,3a,75y,90t/data=!3m8!1e2!3m6!1sCIABIhBEXN1FaYmMhbVLgPOXdHxO!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAPNQkAEx1qTevfegZOaQOm4WqMjDi4Xfue6H3-Cowadn8nuNVfdkh3N8pg7V6pPlCbd6ZRWuf_BKB1_9Ua1ysk-RWRBP7Kro_qgSLysPsOObKWJH0rcGLYo2shNSQJjmrF_bOLnMGS-QvdcxP1A%3Dw203-h152-k-no!7i4032!8i3024!4m7!3m6!1s0x3bae2300551346fd:0x884f69eefd04da5f!8m2!3d13.1029875!4d77.5018281!10e5!16s%2Fg%2F11yfjw4rl_!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D',
  },
  {
    name: 'iFab Innovations Private Limited',
    location: 'Bengaluru',
    type: 'Engineering / Innovation Partner',
    description:
      'Engineering and product innovation partner contributing to practical manufacturing inspection and quality assurance workflows.',
    icon: <Cpu className="w-6 h-6 text-primary" />,
    href: 'https://ifab.tech/',
  },
  {
    name: 'iTelematics Software Private Limited',
    type: 'Software & Platform Partner',
    description:
      'Software platform and technology partner enabling the EV.ENGINEER SaaS infrastructure and product development pipeline.',
    icon: <Code2 className="w-6 h-6 text-primary" />,
    href: 'https://iTelematics.com/',
  },
]

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Does FAI Engineer upload my drawings to your servers?',
    a: 'No. PDF rendering happens entirely in your browser using client-side JavaScript. Your drawing files are never transmitted to our servers.',
  },
  {
    q: 'What drawing formats are supported?',
    a: 'FAI Engineer supports PDF format, which is the standard for engineering drawing distribution. Multi-page PDFs are supported.',
  },
  {
    q: 'Is this compliant with AS9102 Rev B?',
    a: 'The Form 3 export template follows the AS9102 Rev B characteristic accountability format. Always review exported forms with your quality team.',
  },
  {
    q: 'Can I use it without a Google account?',
    a: 'Yes. You can sign in with email and password. Google Drive save/load requires a Google account, but is optional — you can export project files locally.',
  },
  {
    q: 'What is the trial period?',
    a: 'The trial gives you 7 days of full access to all features. No credit card is required to start.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-text-primary text-sm sm:text-base pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Product Mockup ───────────────────────────────────────────────────────────

function ProductMockup() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-14 px-2 sm:px-4">
      {/* Browser chrome frame */}
      <div className="rounded-xl sm:rounded-2xl shadow-2xl shadow-primary/20 border border-border overflow-hidden">
        {/* Browser top bar */}
        <div className="bg-gray-100 border-b border-border px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-text-secondary font-mono border border-border truncate">
            fai.ev.engineer/project/drawing-rev-a
          </div>
        </div>

        {/* App layout */}
        <div className="bg-white flex flex-col">
          {/* App toolbar */}
          <div className="bg-text-primary flex items-center gap-3 px-4 py-2.5 flex-wrap gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-[9px]">F</span>
              </div>
              <span className="text-white font-semibold text-xs">FAI Engineer</span>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-wrap">
              {['Upload', 'Add Balloon', 'Feature Table', 'Export'].map((tool) => (
                <span
                  key={tool}
                  className={`text-[10px] px-2.5 py-1 rounded font-medium ${
                    tool === 'Add Balloon'
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {tool}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-white/50 hidden sm:block">Drawing-Rev-A.pdf</span>
              <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded font-semibold">Saved</span>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-col sm:flex-row" style={{ minHeight: '320px' }}>
            {/* PDF viewer panel */}
            <div className="flex-1 bg-gray-50 relative overflow-hidden border-b sm:border-b-0 sm:border-r border-border" style={{ minHeight: '220px' }}>
              {/* Grid background simulating drawing paper */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(15,111,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,111,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Title block corner */}
              <div className="absolute bottom-0 right-0 border-t border-l border-gray-300 bg-white/90 p-2 text-[8px] text-gray-500 font-mono w-28 sm:w-36">
                <div className="border-b border-gray-200 pb-1 mb-1 font-bold text-gray-700 text-[9px]">PART-2847-REV-A</div>
                <div>ACME AEROSPACE INC</div>
                <div>DWG NO: 2847</div>
                <div>SCALE: 1:2</div>
              </div>

              {/* Simulated drawing geometry */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">
                {/* Main part outline */}
                <rect x="80" y="40" width="240" height="160" rx="4" fill="none" stroke="#475569" strokeWidth="1.5" />
                {/* Inner bore */}
                <ellipse cx="200" cy="120" rx="50" ry="50" fill="none" stroke="#475569" strokeWidth="1.5" />
                {/* Bolt holes */}
                <circle cx="130" cy="80" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="270" cy="80" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="130" cy="160" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="270" cy="160" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                {/* Center lines */}
                <line x1="200" y1="30" x2="200" y2="210" stroke="#0F6FFF" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.5" />
                <line x1="60" y1="120" x2="340" y2="120" stroke="#0F6FFF" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.5" />
                {/* Dimension lines */}
                <line x1="80" y1="220" x2="320" y2="220" stroke="#475569" strokeWidth="0.8" markerEnd="url(#arrow)" />
                <text x="200" y="232" textAnchor="middle" fontSize="9" fill="#0F172A" fontFamily="monospace">240.00 ±0.05</text>

                {/* Balloon 1 — top left bolt hole */}
                <circle cx="118" cy="68" r="10" fill="white" stroke="#0F6FFF" strokeWidth="1.5" />
                <text x="118" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F6FFF" fontFamily="sans-serif">1</text>
                <line x1="128" y1="74" x2="130" y2="80" stroke="#0F6FFF" strokeWidth="1" />

                {/* Balloon 2 — bore circle */}
                <circle cx="245" cy="82" r="10" fill="white" stroke="#0F6FFF" strokeWidth="1.5" />
                <text x="245" y="86" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F6FFF" fontFamily="sans-serif">2</text>
                <line x1="235" y1="88" x2="220" y2="100" stroke="#0F6FFF" strokeWidth="1" />

                {/* Balloon 3 — outer rectangle width */}
                <circle cx="345" cy="120" r="10" fill="white" stroke="#0F6FFF" strokeWidth="1.5" />
                <text x="345" y="124" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F6FFF" fontFamily="sans-serif">3</text>
                <line x1="335" y1="120" x2="320" y2="120" stroke="#0F6FFF" strokeWidth="1" />

                {/* Balloon 4 — bottom right bolt hole */}
                <circle cx="283" cy="172" r="10" fill="white" stroke="#0F6FFF" strokeWidth="1.5" />
                <text x="283" y="176" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F6FFF" fontFamily="sans-serif">4</text>
                <line x1="273" y1="170" x2="270" y2="160" stroke="#0F6FFF" strokeWidth="1" />
              </svg>

              {/* Page indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded px-2 py-1 text-[10px] text-text-secondary border border-border">
                Page 1 / 3
              </div>
            </div>

            {/* Feature table panel */}
            <div className="w-full sm:w-72 bg-white flex flex-col">
              <div className="px-3 py-2 bg-primary-light border-b border-border">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Feature Table</span>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      <th className="px-2 py-1.5 text-left font-semibold text-text-secondary">#</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-text-secondary">Nominal</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-text-secondary">Tol±</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-text-secondary hidden sm:table-cell">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n: 1, nom: 'Ø8.00', tol: '±0.02', type: 'Dia', active: false },
                      { n: 2, nom: 'Ø100.00', tol: '±0.05', type: 'Dia', active: true },
                      { n: 3, nom: '240.00', tol: '±0.05', type: 'Lin', active: false },
                      { n: 4, nom: 'Ø8.00', tol: '±0.02', type: 'Dia', active: false },
                    ].map((row) => (
                      <tr
                        key={row.n}
                        className={`border-b border-border ${row.active ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`px-2 py-2 font-bold ${row.active ? 'text-primary' : 'text-text-primary'}`}>{row.n}</td>
                        <td className="px-2 py-2 font-mono text-text-primary">{row.nom}</td>
                        <td className="px-2 py-2 font-mono text-text-secondary">{row.tol}</td>
                        <td className="px-2 py-2 text-text-secondary hidden sm:table-cell">{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Export bar */}
              <div className="px-3 py-2.5 bg-gray-50 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">4 features</span>
                <button className="text-[10px] bg-primary text-white px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Export Form 3
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-text-secondary mt-4">
        Product preview — PDF viewer, balloon tool, and feature table in one browser tab
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-light via-white to-white pt-16 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              AS9102 First Article Inspection Toolkit
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
              Balloon Drawings and Create{' '}
              <span className="text-primary">AS9102 FAI Reports</span>{' '}
              Faster
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              A browser-based toolkit for engineering drawing ballooning, characteristic tables, and First Article Inspection report preparation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
              >
                Start 7-Day Trial
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="btn-secondary text-base px-8 py-4 w-full sm:w-auto text-center"
              >
                View Features
              </a>
            </div>
            <p className="mt-4 text-xs text-text-secondary">
              No credit card required &mdash; 7 days full access
            </p>
          </div>

          {/* Product mockup */}
          <ProductMockup />

          {/* Industry badge row */}
          <div className="max-w-4xl mx-auto mt-10 pt-8 border-t border-border/60">
            <p className="text-center text-xs font-semibold text-text-secondary uppercase tracking-widest mb-5">
              Built for
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {industries.map((ind) => (
                <div
                  key={ind.label}
                  className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 text-sm font-medium text-text-secondary shadow-sm"
                >
                  <span className="text-primary">{ind.icon}</span>
                  {ind.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Everything You Need for FAI</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                From drawing upload to AS9102 Form 3 export, the complete toolkit in your browser.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary">{f.title}</h3>
                    {f.badge && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.badgeColor ?? 'bg-warning/10 text-warning'}`}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                From drawing to FAI report in four steps.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-start">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mb-4">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-primary/60 tracking-widest mb-1">
                    STEP {step.number}
                  </span>
                  <h3 className="font-semibold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Teams Choose FAI Engineer */}
        <section className="py-20 px-4 bg-primary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Why Teams Choose FAI Engineer
              </h2>
              <p className="mt-3 text-primary-light text-lg max-w-xl mx-auto">
                A practical manufacturing inspection workflow for quality engineers and FAI coordinators across aerospace and manufacturing.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {whyItems.map((item) => (
                <div key={item.text} className="flex items-start gap-3 bg-white/10 rounded-xl p-5">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <p className="text-sm text-white leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Benefits from FAI Engineer */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Who Benefits from FAI Engineer?</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Designed for organizations that create, manufacture, inspect, and validate engineered products across quality inspection workflows.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whoBenefits.map((item) => (
                <div key={item.title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Simple, Transparent Pricing</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                Start free. Upgrade when you're ready.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card p-8 flex flex-col relative ${
                    plan.featured
                      ? 'border-2 border-primary shadow-lg shadow-primary/10'
                      : ''
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="bg-success text-white text-xs font-bold px-4 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                      {plan.name}
                    </h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                      <span className="text-text-secondary text-sm pb-1">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className={plan.featured ? 'btn-primary w-full' : 'btn-secondary w-full'}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Security */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Your Data, Your Control</h2>
              <p className="section-subtitle max-w-xl mx-auto">
                Built for aerospace and manufacturing professionals who require strict data security.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustItems.map((item) => (
                <div key={item.title} className="flex flex-col items-start gap-3">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-4 bg-background">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="py-20 px-4 bg-text-primary">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-slate-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              Future Roadmap
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Engineering Workflows Today.
              <br />
              <span className="text-primary">Inspection Intelligence Tomorrow.</span>
            </h2>
            <p className="mt-5 text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              FAI Engineer focuses on practical engineering drawing ballooning and quality inspection workflows today — while preparing for future inspection automation capabilities.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
              {futureItems.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                  <CheckCircle className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-500">
              Future roadmap items — not available today. Timelines subject to change.
            </p>
          </div>
        </section>

        {/* Engineering & Manufacturing Collaborators */}
        <section className="py-20 px-4 bg-white border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="section-title">Engineering &amp; Manufacturing Collaborators</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                We are working with engineering, manufacturing, and software organizations to build practical drawing ballooning and inspection workflow solutions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {partners.map((partner) => (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                      {partner.icon}
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {partner.type}
                    </span>
                    <h3 className="font-semibold text-text-primary mt-1 leading-snug">
                      {partner.name}
                      {'location' in partner && partner.location && (
                        <span className="font-normal text-text-secondary">, {partner.location}</span>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">
                    {partner.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-semibold group-hover:gap-2.5 transition-all">
                    Visit Partner
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-4 bg-text-primary">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to streamline your FAI process?
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Start your free 7-day trial. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors w-full sm:w-auto"
              >
                Start 7-Day Trial
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
