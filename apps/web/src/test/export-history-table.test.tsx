import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExportHistoryTable } from '../../app/dashboard/settings/components/ExportHistoryTable'

describe('ExportHistoryTable', () => {
  it('renders loading state on initial render', () => {
    const markup = renderToStaticMarkup(<ExportHistoryTable />)
    expect(markup).toContain('Loading export history')
  })
})
