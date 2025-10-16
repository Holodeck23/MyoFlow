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

  it('should return 500 for invalid postal code format', async () => {
    const request = new Request('http://localhost:3000/api/settings/travel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basePostalCode: '0000' }), // Invalid - starts with 0
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('Failed to update travel settings');
  });
});
