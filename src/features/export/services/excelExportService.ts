import * as XLSX from 'xlsx'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'

export function exportFeaturesToExcel(
  features: Feature[],
  balloons: Balloon[],
  projectName: string,
): void {
  const balloonMap = new Map(balloons.map(b => [b.id, b]))
  const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)

  const rows = sorted.map(f => {
    const balloon = balloonMap.get(f.balloonId)
    return {
      'Feature No': f.featureNumber,
      'Balloon No': f.balloonNumber,
      'Page No': balloon?.pageNumber ?? '',
      'Type': f.type,
      'Nominal': f.nominal || '',
      'Tolerance': f.tolerance || '',
      'Min': f.min || '',
      'Max': f.max || '',
      'Units': f.units || '',
      'Comments': f.comments || '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, // Feature No
    { wch: 12 }, // Balloon No
    { wch: 10 }, // Page No
    { wch: 16 }, // Type
    { wch: 12 }, // Nominal
    { wch: 14 }, // Tolerance
    { wch: 12 }, // Min
    { wch: 12 }, // Max
    { wch: 10 }, // Units
    { wch: 30 }, // Comments
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Feature Table')

  const date = new Date().toISOString().slice(0, 10)
  const safeName = projectName.replace(/[^\w-]/g, '_')
  XLSX.writeFile(wb, `FAI_${safeName}_${date}.xlsx`)
}

export function buildFeaturesWorkbookBytes(features: Feature[], balloons: Balloon[]): Uint8Array {
  const balloonMap = new Map(balloons.map(b => [b.id, b]))
  const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)
  const rows = sorted.map(f => {
    const balloon = balloonMap.get(f.balloonId)
    return {
      'Feature No': f.featureNumber,
      'Balloon No': f.balloonNumber,
      'Page No': balloon?.pageNumber ?? '',
      'Type': f.type,
      'Nominal': f.nominal || '',
      'Tolerance': f.tolerance || '',
      'Min': f.min || '',
      'Max': f.max || '',
      'Units': f.units || '',
      'Comments': f.comments || '',
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 16 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 30 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Feature Table')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array
}

export function exportFeaturesToCSV(
  features: Feature[],
  balloons: Balloon[],
  projectName: string,
): void {
  const balloonMap = new Map(balloons.map(b => [b.id, b]))
  const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)

  const header = ['Feature No', 'Balloon No', 'Page No', 'Type', 'Nominal', 'Tolerance', 'Min', 'Max', 'Units', 'Comments']
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csvRows = sorted.map(f => {
    const balloon = balloonMap.get(f.balloonId)
    return [
      f.featureNumber,
      f.balloonNumber,
      balloon?.pageNumber ?? '',
      q(f.type),
      q(f.nominal || ''),
      q(f.tolerance || ''),
      q(f.min || ''),
      q(f.max || ''),
      q(f.units || ''),
      q(f.comments || ''),
    ].join(',')
  })

  const csv = [header.join(','), ...csvRows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  const safeName = projectName.replace(/[^\w-]/g, '_')
  a.href = url
  a.download = `FAI_${safeName}_${date}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
