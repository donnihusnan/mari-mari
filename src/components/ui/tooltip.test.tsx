import { describe, expect, it } from 'bun:test'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipWrapper } from './tooltip'

describe('Tooltip component exports', () => {
  it('exports all standard Base UI tooltip components and TooltipWrapper helper', () => {
    expect(Tooltip).toBeDefined()
    expect(TooltipTrigger).toBeDefined()
    expect(TooltipContent).toBeDefined()
    expect(TooltipProvider).toBeDefined()
    expect(TooltipWrapper).toBeDefined()
  })
})
