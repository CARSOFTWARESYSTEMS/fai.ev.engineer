import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyntheticPocBanner } from './SyntheticPocBanner'

describe('SyntheticPocBanner', () => {
  it('always renders the synthetic / non-operational disclaimer', () => {
    render(<SyntheticPocBanner />)
    expect(screen.getByText('SYNTHETIC POC — NOT FOR OPERATIONAL OR FLIGHT DECISIONS')).toBeInTheDocument()
  })
})
