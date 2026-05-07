import { describe, it, expect } from 'vitest'
import { generateHandle, isValidHandle } from '../handle'

describe('generateHandle', () => {
  it('returns adverb-adjective-noun pattern', () => {
    const handle = generateHandle()
    expect(handle).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
    expect(handle.split('-')).toHaveLength(3)
  })

  it('generates different handles on repeated calls (probabilistic)', () => {
    const handles = new Set(Array.from({ length: 20 }, generateHandle))
    expect(handles.size).toBeGreaterThan(1)
  })
})

describe('isValidHandle', () => {
  it('accepts valid handles', () => {
    expect(isValidHandle('swiftly-golden-fox')).toBe(true)
    expect(isValidHandle('boldly-brave-crane')).toBe(true)
  })

  it('rejects handles with wrong structure', () => {
    expect(isValidHandle('one-two')).toBe(false)
    expect(isValidHandle('one-two-three-four')).toBe(false)
    expect(isValidHandle('UPPER-case-fox')).toBe(false)
    expect(isValidHandle('')).toBe(false)
  })
})
