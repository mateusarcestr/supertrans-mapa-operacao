import { describe, expect, it } from 'vitest'

import { classifyReadiness } from './readiness'

describe('classifyReadiness', () => {
  it('keeps geometry-derived responsibility visibly inferred', () => {
    expect(
      classifyReadiness({
        assignmentMethod: 'geometry',
        assignmentClassification: 'inferred',
      }),
    ).toEqual('READY_WITH_INFERENCE_BADGE')
  })

  it('does not promote a partial reconciliation to confirmed', () => {
    expect(classifyReadiness({ reconciliationStatus: 'partially-matched' })).toEqual('NEEDS_HUMAN_REVIEW')
  })

  it('keeps an unresolved subprocess target unavailable', () => {
    expect(classifyReadiness({ subprocessResolution: 'unresolved' })).toEqual('NOT_AVAILABLE')
  })

  it('prioritizes an explicit source conflict over inferred lane assignment', () => {
    expect(
      classifyReadiness({
        assignmentMethod: 'geometry',
        assignmentClassification: 'inferred',
        hasSourceConflict: true,
      }),
    ).toEqual('READY_WITH_SOURCE_CONFLICT')
  })
})
