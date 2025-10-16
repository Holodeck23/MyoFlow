import { describe, it, expect } from 'vitest';
import {
  assertValidAustrianPostalCode,
  normalizeVatNumber,
  isValidAustrianVatNumber,
  normalizeAustrianIban,
  assertValidAustrianIban,
  isValidAustrianIban,
} from './';

describe('Validation Library', () => {
  describe('Austrian Postal Code', () => {
    it('should accept valid 4-digit postal codes', () => {
      expect(() => assertValidAustrianPostalCode('4020')).not.toThrow();
    });

    it('should reject invalid postal codes', () => {
      expect(() => assertValidAustrianPostalCode('123')).toThrow('Invalid Austrian postal code');
    });
  });

  describe('Austrian VAT Number', () => {
    it('should normalize VAT numbers', () => {
      expect(normalizeVatNumber(' atu 12345678 ')).toBe('ATU 12345678');
    });

    it('should validate correct VAT numbers', () => {
      expect(isValidAustrianVatNumber('ATU12345678')).toBe(true);
    });

    it('should invalidate incorrect VAT numbers', () => {
      expect(isValidAustrianVatNumber('ATU1234567')).toBe(false);
    });
  });

  describe('Austrian IBAN', () => {
    it('should normalize IBANs', () => {
      expect(normalizeAustrianIban('AT61 1904 4002 3457 3201')).toBe('AT611904400234573201');
    });

    it('should validate correct IBANs', () => {
        expect(isValidAustrianIban('AT483200000012345864')).toBe(true);
      });

    it('should invalidate incorrect IBANs', () => {
        expect(isValidAustrianIban('AT611904400234573200')).toBe(false);
    });

    it('should throw an error for invalid IBANs with assert', () => {
        expect(() => assertValidAustrianIban('AT611904400234573200')).toThrow('Invalid Austrian IBAN');
    });
  });
});
