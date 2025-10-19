import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AccountingExportsTab } from '../../app/dashboard/settings/components/AccountingExportsTab'

describe('AccountingExportsTab', () => {
  it('renders configuration form and history sections', () => {
    const markup = renderToStaticMarkup(<AccountingExportsTab />)

    expect(markup).toContain('Accounting Exports')
    expect(markup).toContain('Recent Exports')
    expect(markup).toContain('Need a reminder?')
  })
})
