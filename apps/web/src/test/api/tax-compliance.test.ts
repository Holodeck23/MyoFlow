import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAuth, mockPrisma } from './helper';
import { PUT } from '../../../app/api/settings/tax-compliance/route';
import type { NextRequest } from 'next/server';
import { setupEnsureTherapistAccountMock } from '../helpers/mock-auth';

describe('Settings API - Tax Compliance', () => {
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

  it('should return 400 for invalid VAT number', async () => {
    const request = new Request('http://localhost:3000/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber: '12345678' }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid VAT/UID number');
  });

  it('should return 400 if VAT and Kleinunternehmer are both true', async () => {
    const request = new Request('http://localhost:3000/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatRegistered: true, kleinunternehmerActive: true }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('mutually exclusive');
  });
});
