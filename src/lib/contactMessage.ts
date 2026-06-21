export interface ContactMessageContext {
  userName?: string
  userEmail?: string
  userPhone?: string
  userRole?: string
  userLifecycleStatus?: string
  domain?: string
  partnerName?: string
  organizationName?: string
  organizationCode?: string
  projectName?: string
  projectId?: string
  partNumber?: string
  drawingNumber?: string
  projectStatus?: string
  projectLifecycleStatus?: string
  issue?: string
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed !== 'undefined' && trimmed !== 'null' ? trimmed : undefined
}

export function buildContactContextMessage(context: ContactMessageContext): string {
  const userRows: Array<[string, string | undefined]> = [
    ['User Name', context.userName],
    ['User Email', context.userEmail],
    ['User Phone', context.userPhone],
    ['User Role', context.userRole],
    ['User Lifecycle Status', context.userLifecycleStatus],
  ]
  const organizationRows: Array<[string, string | undefined]> = [
    ['Domain', context.domain],
    ['Partner', context.partnerName],
    ['Organization', context.organizationName],
    ['Organization Code', context.organizationCode],
  ]
  const projectRows: Array<[string, string | undefined]> = [
    ['Project Name', context.projectName],
    ['Project ID', context.projectId],
    ['Part Number', context.partNumber],
    ['Drawing Number', context.drawingNumber],
    ['Project Status', context.projectStatus],
    ['Project Lifecycle Status', context.projectLifecycleStatus],
  ]

  const render = (rows: Array<[string, string | undefined]>) => rows
    .map(([label, value]) => [label, clean(value)] as const)
    .filter((row): row is readonly [string, string] => Boolean(row[1]))
    .map(([label, value]) => `${label}: ${value}`)

  const sections = [render(userRows), render(organizationRows), render(projectRows)]
    .filter(section => section.length > 0)
  const issue = clean(context.issue)
  if (issue) sections.push([`Issue: ${issue}`])

  return ['Hello,', '', ...sections.flatMap((section, index) => index ? ['', ...section] : section)].join('\n')
}

export function buildMailtoLink(email: string, subject: string, context: ContactMessageContext): string {
  const recipient = clean(email) ?? ''
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildContactContextMessage(context))}`
}

export function buildWhatsAppLink(phone: string, context: ContactMessageContext): string {
  const normalizedPhone = phone.replace(/[+\s-]/g, '').replace(/\D/g, '')
  if (!normalizedPhone) return ''
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildContactContextMessage(context))}`
}
