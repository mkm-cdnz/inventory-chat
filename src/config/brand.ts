/**
 * Matt Millar Brand System v2.0
 * Canonical human + AI reference for professional visual consistency.
 * 
 * Strict constraints:
 * - Primary Dark: #2c3e50 (headers, wordmark, primary buttons)
 * - Secondary Dark: #34495e (support, dark surfaces)
 * - Accent Blue: #3498db (rules, active links, accents, bullets)
 * - Accent Blue Dark: #2980b9 (gradient partner)
 * - Body Text: #333333
 * - Muted Text: #7f8c8d
 * - Light Gray: #ecf0f1
 * - Background: #ffffff
 * - Light Accent: rgba(52,152,219,0.10)
 * - Gradients:
 *    Primary: linear-gradient(135deg, #2c3e50 0%, #34495e 100%)
 *    Accent: linear-gradient(to right, #3498db, #2980b9)
 * - Canonical MM Logo: six-bar monogram (Tall-Short-Tall, Tall-Short-Tall)
 *    viewBox: 0 0 144 96; width: 16; gap: 8; y: 16; tall: 64; short: 40; x: 4, 28, 52, 76, 100, 124
 */

export const MM_BRAND = {
  name: 'Matt Millar',
  title: 'Hardware Catalogue',
  longName: 'Matt Millar Professional Services',
  version: '2.0',
  colors: {
    primaryDark: '#2c3e50',
    secondaryDark: '#34495e',
    accentBlue: '#3498db',
    accentBlueDark: '#2980b9',
    bodyText: '#333333',
    mutedText: '#7f8c8d',
    lightGray: '#ecf0f1',
    background: '#ffffff',
    lightAccent: 'rgba(52, 152, 219, 0.10)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    accent: 'linear-gradient(to right, #3498db, #2980b9)',
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  contact: {
    email: 'matt@mattmillar.co.nz',
    emailHref: 'mailto:matt@mattmillar.co.nz',
    phoneHuman: '+64 22 459 6484',
    phoneHref: 'tel:+64224596484',
    linkedin: 'https://www.linkedin.com/in/matt-millar-3a4892121/',
    github: 'https://github.com/mkm-cdnz/',
  },
} as const;
