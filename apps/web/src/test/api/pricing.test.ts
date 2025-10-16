import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAuth, mockPrisma } from './helper';
import { PUT } from '../../../app/api/settings/pricing/route';
import type { NextRequest } from 'next/server';
import { setupEnsureTherapistAccountMock } from '../helpers/mock-auth';

describe('Settings API - Pricing', () => {
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

  it('should return 400 if RKSV is enabled with revenue below 15k', async () => {
    const request = new Request('http://localhost:3000/api/settings/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rksvEnabled: true, yearlyRevenue: '14999' }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('RKSV can only be enabled for revenue over €15,000');
  });
});
