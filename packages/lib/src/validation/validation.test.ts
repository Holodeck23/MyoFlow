import { describe, it, expect } from 'vitest';
import {
  assertValidAustrianPostalCode,
  normalizeVatNumber,
  isValidAustrianVatNumber,
  normalizeAustrianIban,
  assertValidAustrianIban,
  isValidAustrianIban,
  assertValidChamberId,
  isValidChamberId,
  normalizeChamberId,
  assertValidLogoUrl,
  isValidLogoUrl,
  normalizeLogoUrl,
} from './'

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

  describe('Austrian Chamber ID', () => {
    it('normalizes chamber IDs', () => {
      expect(normalizeChamberId('  wkt1234  ')).toBe('WKT1234');
    });

    it('validates chamber IDs with provincial prefix and digits', () => {
      expect(isValidChamberId('WKT1234')).toBe(true);
      expect(isValidChamberId('NÖG98765')).toBe(true);
    });

    it('rejects invalid chamber IDs', () => {
      expect(isValidChamberId('12345')).toBe(false);
      expect(isValidChamberId('W@1234')).toBe(false);
      expect(() => assertValidChamberId('invalid')).toThrow('Invalid Chamber ID');
    });
  });

  describe('Logo URL', () => {
    it('normalizes logo URLs', () => {
      expect(normalizeLogoUrl('  https://example.com/logo.png  ')).toBe('https://example.com/logo.png');
    });

    it('accepts http(s) URLs with image extensions', () => {
      expect(isValidLogoUrl('https://example.com/logo.png')).toBe(true);
      expect(isValidLogoUrl('http://cdn.example.com/brand.svg')).toBe(true);
    });

    it('accepts base64 data URLs', () => {
      expect(isValidLogoUrl('data:image/png;base64,abcdef')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidLogoUrl('ftp://example.com/logo.png')).toBe(false);
      expect(isValidLogoUrl('https://example.com/file.pdf')).toBe(false);
      expect(() => assertValidLogoUrl('not-a-url')).toThrow('Invalid logo URL');
    });
  });
});
