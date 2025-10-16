import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAuth, mockGetServerSession, mockPrisma } from './helper';
import { GET, PUT } from '../../../app/api/settings/profile/route';
import type { NextRequest } from 'next/server';
import { setupEnsureTherapistAccountMock } from '../helpers/mock-auth';

describe('Settings API - Profile', () => {
  const mockTherapist = {
    id: 'therapist-1',
    settings: {
      id: 'settings-1',
      settingsVersion: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupEnsureTherapistAccountMock(mockAuth, mockPrisma, mockTherapist);
  });

  it('should return default settings when none exist', async () => {
    mockPrisma.therapist.findFirst.mockResolvedValue({
      ...mockTherapist,
      settings: null,
    });

    const request = new Request('http://localhost:3000/api/settings/profile');
    const response = await GET(request as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it.skip('should create settings on first PUT', async () => {
    mockPrisma.settings.create.mockResolvedValue({
      id: 'settings-2',
      therapistId: 'therapist-1',
      settingsVersion: 1,
    });
    mockPrisma.therapist.findFirst.mockResolvedValue({
      ...mockTherapist,
      settings: null,
    });
    mockPrisma.settings.update.mockResolvedValue({
      id: 'settings-2',
      therapistId: 'therapist-1',
      settingsVersion: 2,
    });
    const request = new Request('http://localhost:3000/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Praxis Müller' }),
    });
    const response = await PUT(request as NextRequest);
    expect(response.status).toBe(200);
  });

  it.skip('should update existing settings on PUT', async () => {
    mockPrisma.settings.update.mockResolvedValue({
      id: 'settings-1',
      therapistId: 'therapist-1',
      settingsVersion: 2,
    });
    const request = new Request('http://localhost:3000/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Praxis Müller' }),
    });
    const response = await PUT(request as NextRequest);


    expect(response.status).toBe(200);
    expect(mockPrisma.settings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessName: 'Praxis Müller',
        }),
      })
    );
  });

  it('should return 400 for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: '' }),
    });
    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
  });

  it.skip('should increment settingsVersion on PUT', async () => {
    mockPrisma.settings.update.mockResolvedValue({
      id: 'settings-1',
      therapistId: 'therapist-1',
      settingsVersion: 2,
    });
    const request = new Request('http://localhost:3000/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Praxis Müller' }),
    });
    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(200);
    expect(mockPrisma.settings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settingsVersion: {
            increment: 1,
          },
        }),
      })
    );
  });
});
