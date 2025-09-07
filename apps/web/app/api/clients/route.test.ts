import { describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from './route'

const { mockCreate, mockFindTherapist } = vi.hoisted(() => ({
  mockCreate: vi.fn().mockResolvedValue({ id: 'c1', name: 'Alice', email: null, tags: [] }),
  mockFindTherapist: vi.fn().mockResolvedValue({ id: 't1' })
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
}))

vi.mock('@myoflow/db', () => ({
  prisma: {
    therapist: { findFirst: mockFindTherapist, create: vi.fn() },
    user: { upsert: vi.fn() },
    client: { create: mockCreate }
  }
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

describe('POST /api/clients', () => {
  it('validates request body', async () => {
    const req = new Request('http://localhost/api/clients', { method: 'POST', body: JSON.stringify({}) }) as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates client with valid data', async () => {
    const body = { name: 'Alice' }
    const req = new Request('http://localhost/api/clients', { method: 'POST', body: JSON.stringify(body) }) as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalled()
    const data = await res.json()
    expect(data.name).toBe('Alice')
  })
})
