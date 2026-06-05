// Transit brand tokens — do not hard-code these values elsewhere
export const T = {
  // Ink / navy scale
  INK_900: '#071633',
  INK_800: '#0A2047',
  NAVY: '#0F2B5B',
  NAVY_600: '#163B78',
  NAVY_500: '#1F4E97',

  // Amber accent
  AMBER: '#F7B32B',
  AMBER_DEEP: '#E8941A',
  AMBER_LIGHT: '#FFCA5E',
  AMBER_SOFT: 'rgba(247,179,43,0.14)' as string,
  AMBER_LINE: 'rgba(247,179,43,0.40)' as string,

  // Surfaces
  PAPER: '#F4F1EA',
  SURFACE: '#FFFFFF',
  SURFACE_2: '#F5F6F8',
  LINE: '#E7E9EE',

  // Text
  TEXT: '#0F2B5B',
  TEXT_MUTED: '#5C6B86',
  TEXT_FAINT: '#93A0B5',
  ON_NAVY: '#EAF0FA',
  ON_NAVY_MUT: 'rgba(234,240,250,0.62)' as string,
  ON_AMBER: '#0A2047',

  // Semantic
  SUCCESS: '#1E9E6A',
  SUCCESS_SOFT: '#E4F3EC',
  DANGER: '#DC4E37',
  DANGER_SOFT: '#FBE9E5',

  // Vehicle type colours
  BIKE: '#3E86F5',
  AUTO: '#F7B32B',
  CAB: '#1E9E6A',

  // Radii
  R_XS: 8,
  R_SM: 12,
  R_MD: 16,
  R_LG: 20,
  R_XL: 28,
  R_PILL: 999,

  // Shadows
  SHADOW_SM: {
    shadowColor: '#0F2B5B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  SHADOW_MD: {
    shadowColor: '#0F2B5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  SHADOW_LG: {
    shadowColor: '#071633',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 8,
  },
  SHADOW_AMBER: {
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 10,
    elevation: 4,
  },
  SHADOW_SHEET: {
    shadowColor: '#071633',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 20,
  },
} as const;
