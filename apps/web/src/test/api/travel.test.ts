import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAuth, mockPrisma } from './helper';
import { PUT } from '../../../app/api/settings/travel/route';
import type { NextRequest } from 'next/server';
import { setupEnsureTherapistAccountMock } from '../helpers/mock-auth';

describe('Settings API - Travel', () => {
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

  it('should return 400 for invalid postal code', async () => {
    const request = new Request('http://localhost:3000/api/settings/travel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basePostalCode: '1234' }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('4xxx format');
  });
});
