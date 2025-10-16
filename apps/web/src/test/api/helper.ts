import { vi } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn().mockResolvedValue({
        id: 'user-1',
        Therapist: {
            id: 'therapist-1',
            settings: {
                id: 'settings-1',
            }
        }
    }),
    upsert: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  travelSettings: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  taxComplianceSettings: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (callback) => callback(mockPrisma)),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  getServerSession: mockGetServerSession,
}));

vi.mock('../../lib/auth', () => ({
  auth: mockAuth,
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@myoflow/db', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        prisma: mockPrisma,
        PrismaClient: vi.fn(() => mockPrisma),
    }
});

export { mockAuth, mockGetServerSession, mockPrisma };
