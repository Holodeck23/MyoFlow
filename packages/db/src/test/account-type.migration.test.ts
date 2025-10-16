import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { prisma, AccountType } from '../..'

describe('Account Type Schema Migration', () => {
  let userId: string

  beforeEach(async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const user = await prisma.user.create({
      data: {
        email: `account-type-test-${uniqueSuffix}@example.com`,
        name: 'Account Type Test User',
      },
    })
    userId = user.id
  })

  afterEach(async () => {
    await prisma.archivedData.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it('defaults new users to TEST account type', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.accountType).toBe('TEST')
  })

  it('allows setting explicit account types', async () => {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountType: AccountType.ADMIN },
    })

    expect(updated.accountType).toBe('ADMIN')
  })

  it('stores archived data linked to the user', async () => {
    const archive = await prisma.archivedData.create({
      data: {
        userId,
        data: { clients: [], invoices: [] },
        note: 'automated test archive',
      },
    })

    expect(archive.userId).toBe(userId)
    expect(archive.data).toMatchObject({ clients: [], invoices: [] })

    const fetched = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { ArchivedData: true },
    })

    expect(fetched.ArchivedData).toHaveLength(1)
    expect(fetched.ArchivedData[0].id).toBe(archive.id)
  })
})
