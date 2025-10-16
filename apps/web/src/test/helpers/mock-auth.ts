export function setupEnsureTherapistAccountMock(
    mockAuth: any,
    mockPrisma: any,
    therapist: any,
    user?: any
  ) {
    const mockUser = user || {
      id: 'user-1',
      email: 'therapist@example.com',
      name: 'Test Therapist',
      role: 'OWNER',
    }

    // Mock auth() call
    mockAuth.mockResolvedValue({
      user: {
        email: mockUser.email,
        name: mockUser.name,
      },
    })

    // Mock user.upsert (called by ensureTherapistAccount)
    mockPrisma.user.upsert.mockResolvedValue(mockUser)

    // Mock therapist.findUnique (first call checks if exists)
    mockPrisma.therapist.findUnique.mockResolvedValue(therapist)

    // Mock therapist.findFirst (used by requireTherapist in GET)
    mockPrisma.therapist.findFirst.mockResolvedValue(therapist)

    return { mockUser, mockTherapist: therapist }
  }
