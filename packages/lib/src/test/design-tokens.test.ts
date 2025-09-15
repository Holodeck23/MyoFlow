// Tests for Austrian Medical Design Token System
import { describe, it, expect } from 'vitest'
import {
  austrianMedicalColors,
  austrianTypography,
  austrianSpacing,
  austrianRadius,
  austrianShadows,
  austrianBreakpoints,
  type AustrianColorPalette,
  type AustrianTypographyScale
} from '../design-tokens/austrian-medical'

describe('Austrian Medical Design Tokens', () => {
  describe('Color Palette', () => {
    it('should have Austrian Medical Blue primary colors', () => {
      expect(austrianMedicalColors.primary.DEFAULT).toBe('#1565C0')
      expect((austrianMedicalColors.primary as any)['50']).toMatch(/^#[0-9A-F]{6}$/i)
      expect((austrianMedicalColors.primary as any)['900']).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should have Austrian Red accent colors', () => {
      expect(austrianMedicalColors.accent.DEFAULT).toBe('#C8102E')
      expect((austrianMedicalColors.accent as any)['50']).toMatch(/^#[0-9A-F]{6}$/i)
      expect((austrianMedicalColors.accent as any)['900']).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should have medical semantic colors', () => {
      expect(austrianMedicalColors.success).toHaveProperty('DEFAULT')
      expect(austrianMedicalColors.warning).toHaveProperty('DEFAULT')
      expect(austrianMedicalColors.danger).toHaveProperty('DEFAULT')
      expect(austrianMedicalColors.info).toHaveProperty('DEFAULT')
    })

    it('should have neutral grays for medical interfaces', () => {
      expect(austrianMedicalColors.neutral).toHaveProperty('50')
      expect(austrianMedicalColors.neutral).toHaveProperty('100')
      expect(austrianMedicalColors.neutral).toHaveProperty('900')
      expect(austrianMedicalColors.neutral).toHaveProperty('950')
    })

    it('should have GDPR compliance indicator colors', () => {
      expect(austrianMedicalColors.gdpr).toHaveProperty('encrypted')
      expect(austrianMedicalColors.gdpr).toHaveProperty('sensitive')
      expect(austrianMedicalColors.gdpr).toHaveProperty('audit')
    })
  })

  describe('Typography Scale', () => {
    it('should have Inter font as primary typeface', () => {
      expect(austrianTypography.fontFamily.sans).toContain('Inter')
      expect(austrianTypography.fontFamily.sans).toContain('system-ui')
    })

    it('should have medical-appropriate font sizes', () => {
      expect(austrianTypography.fontSize).toHaveProperty('xs')
      expect(austrianTypography.fontSize).toHaveProperty('sm')
      expect(austrianTypography.fontSize).toHaveProperty('base')
      expect(austrianTypography.fontSize).toHaveProperty('lg')
      expect(austrianTypography.fontSize).toHaveProperty('xl')
      expect(austrianTypography.fontSize).toHaveProperty('2xl')
      expect(austrianTypography.fontSize).toHaveProperty('3xl')
    })

    it('should have readable line heights for healthcare content', () => {
      expect(austrianTypography.lineHeight.tight).toBeDefined()
      expect(austrianTypography.lineHeight.normal).toBeDefined()
      expect(austrianTypography.lineHeight.relaxed).toBeDefined()
    })

    it('should have professional font weights', () => {
      expect(austrianTypography.fontWeight.normal).toBe('400')
      expect(austrianTypography.fontWeight.medium).toBe('500')
      expect(austrianTypography.fontWeight.semibold).toBe('600')
      expect(austrianTypography.fontWeight.bold).toBe('700')
    })
  })

  describe('Spacing System', () => {
    it('should have base spacing unit of 4px', () => {
      expect(austrianSpacing['1']).toBe('0.25rem') // 4px
      expect(austrianSpacing['2']).toBe('0.5rem')  // 8px
      expect(austrianSpacing['4']).toBe('1rem')    // 16px
    })

    it('should have healthcare-appropriate spacing scales', () => {
      expect(austrianSpacing).toHaveProperty('0')
      expect(austrianSpacing).toHaveProperty('px')
      expect(austrianSpacing).toHaveProperty('0.5')
      expect(austrianSpacing).toHaveProperty('1')
      expect(austrianSpacing).toHaveProperty('16')
      expect(austrianSpacing).toHaveProperty('20')
      expect(austrianSpacing).toHaveProperty('24')
    })
  })

  describe('Border Radius', () => {
    it('should have medical-appropriate radius values', () => {
      expect(austrianRadius.none).toBe('0px')
      expect(austrianRadius.sm).toBe('0.125rem')
      expect(austrianRadius.DEFAULT).toBe('0.25rem')
      expect(austrianRadius.md).toBe('0.375rem')
      expect(austrianRadius.lg).toBe('0.5rem')
    })

    it('should have professional rounded values for cards and forms', () => {
      expect(austrianRadius.card).toBeDefined()
      expect(austrianRadius.form).toBeDefined()
      expect(austrianRadius.button).toBeDefined()
    })
  })

  describe('Box Shadows', () => {
    it('should have subtle medical shadows', () => {
      expect(austrianShadows.sm).toBeDefined()
      expect(austrianShadows.DEFAULT).toBeDefined()
      expect(austrianShadows.md).toBeDefined()
      expect(austrianShadows.lg).toBeDefined()
    })

    it('should have specialized healthcare shadows', () => {
      expect(austrianShadows.card).toBeDefined()
      expect(austrianShadows.modal).toBeDefined()
      expect(austrianShadows.gdpr).toBeDefined()
    })
  })

  describe('Responsive Breakpoints', () => {
    it('should have mobile-first breakpoints', () => {
      expect(austrianBreakpoints.sm).toBe('640px')
      expect(austrianBreakpoints.md).toBe('768px')
      expect(austrianBreakpoints.lg).toBe('1024px')
      expect(austrianBreakpoints.xl).toBe('1280px')
      expect(austrianBreakpoints['2xl']).toBe('1536px')
    })

    it('should have therapy practice specific breakpoints', () => {
      expect(austrianBreakpoints.mobile).toBeDefined()
      expect(austrianBreakpoints.tablet).toBeDefined()
      expect(austrianBreakpoints.desktop).toBeDefined()
    })
  })

  describe('Austrian Cultural Elements', () => {
    it('should include Austrian flag colors as cultural accents', () => {
      expect(austrianMedicalColors.cultural).toHaveProperty('flagRed')
      expect(austrianMedicalColors.cultural).toHaveProperty('flagWhite')
      expect(austrianMedicalColors.cultural.flagRed).toBe('#ED2939')
      expect(austrianMedicalColors.cultural.flagWhite).toBe('#FFFFFF')
    })

    it('should have Kleinunternehmer specific colors', () => {
      expect(austrianMedicalColors.kleinunternehmer).toHaveProperty('progress')
      expect(austrianMedicalColors.kleinunternehmer).toHaveProperty('threshold')
      expect(austrianMedicalColors.kleinunternehmer).toHaveProperty('warning')
    })
  })

  describe('Type Safety', () => {
    it('should have proper TypeScript types for color palette', () => {
      const colors: AustrianColorPalette = austrianMedicalColors
      expect(colors).toBeDefined()
      expect(colors.primary).toHaveProperty('DEFAULT')
    })

    it('should have proper TypeScript types for typography', () => {
      const typography: AustrianTypographyScale = austrianTypography
      expect(typography).toBeDefined()
      expect(typography.fontFamily).toHaveProperty('sans')
    })
  })
})