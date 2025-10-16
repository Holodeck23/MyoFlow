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

    // Mock therapist.update (for settings version increment)
    mockPrisma.therapist.update.mockResolvedValue({ ...therapist, settingsVersion: (therapist.settings?.settingsVersion || 0) + 1 })

    // Mock travelSettings.upsert (used in travel route)
    if (mockPrisma.travelSettings) {
      mockPrisma.travelSettings.upsert.mockResolvedValue({ id: 'travel-1', therapistId: therapist.id })
      mockPrisma.travelSettings.update.mockResolvedValue({ id: 'travel-1', therapistId: therapist.id })
    }

    // Mock taxComplianceSettings.upsert (used in tax-compliance route)
    if (mockPrisma.taxComplianceSettings) {
      mockPrisma.taxComplianceSettings.upsert.mockResolvedValue({ id: 'tax-1', therapistId: therapist.id })
      mockPrisma.taxComplianceSettings.update.mockResolvedValue({ id: 'tax-1', therapistId: therapist.id })
    }

    return { mockUser, mockTherapist: therapist }
  }
