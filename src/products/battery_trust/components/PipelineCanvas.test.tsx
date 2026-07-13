import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineCanvas } from './PipelineCanvas'
import { buildHappyPathRun } from '../services/LocalSimulationGateway'
import { SCN_HAPPY_001, REF_2W_LFP_51V_V1 } from '../domain/fixtures'

describe('PipelineCanvas', () => {
  it('renders nine steps with SIM-005 shown as SKIPPED and the rest as PASS', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    render(<PipelineCanvas steps={run.steps} selectedIndex={null} onSelect={vi.fn()} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(9)

    expect(screen.getByText('SIM-005')).toBeInTheDocument()
    const skippedChips = screen.getAllByText('SKIPPED')
    expect(skippedChips).toHaveLength(1)

    const passChips = screen.getAllByText('PASS')
    expect(passChips).toHaveLength(8)
  })
})
