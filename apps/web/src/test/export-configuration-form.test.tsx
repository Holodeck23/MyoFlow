import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExportConfigurationForm } from '../../app/dashboard/settings/components/ExportConfigurationForm'
import { getPreviousMonthRange } from '../../app/dashboard/settings/components/accounting-export-utils'

describe('ExportConfigurationForm', () => {
  it('renders default date range and target system options', () => {
    const onPreview = vi.fn()
    const onGenerate = vi.fn()
    const { start, end } = getPreviousMonthRange()

    const markup = renderToStaticMarkup(
      <ExportConfigurationForm onPreview={onPreview} onGenerate={onGenerate} />
    )

    expect(markup).toContain('BMD (Austria)')
    expect(markup).toContain('RZL (Austria)')
    expect(markup).toContain('name="dateRangeStart"')
    expect(markup).toContain('name="dateRangeEnd"')
    expect(markup).toContain('Preview Export')
    expect(markup).toContain('Generate &amp; Download')
  })
})
