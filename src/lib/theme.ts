export type ThemeVars = {
  "--primary": string;
  "--primary-rgb": string;
  "--accent": string;
  "--accent-rgb": string;
  "--background": string;
  "--foreground": string;
};

const hexToRgb = (hex: string): string => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
};

export function resolveThemeVars(opts?: {
  palette?: string;
  customPrimary?: string;
  customAccent?: string;
  customBackground?: string;
  customForeground?: string;
}): ThemeVars {
  const palette = opts?.palette || 'gz-dark-accessible';

  const palettes: Record<string, ThemeVars> = {
    // Accessibile scuro: contrasto AA/AAA per testo su background
    'gz-dark-accessible': {
      '--primary': '#198F19', // più luminoso per contrasto su dark
      '--primary-rgb': hexToRgb('#198F19'),
      '--accent': '#00C476',
      '--accent-rgb': hexToRgb('#00C476'),
      '--background': '#0A0C0F',
      '--foreground': '#F2F5F7',
    },
    'gz-dark': {
      '--primary': '#0B5E0B',
      '--primary-rgb': hexToRgb('#0B5E0B'),
      '--accent': '#00D084',
      '--accent-rgb': hexToRgb('#00D084'),
      '--background': '#0E0F12',
      '--foreground': '#F7F9FB',
    },
    'gz-green': {
      '--primary': '#176B17',
      '--primary-rgb': hexToRgb('#176B17'),
      '--accent': '#0EA5E9',
      '--accent-rgb': hexToRgb('#0EA5E9'),
      '--background': '#F2F5F7',
      '--foreground': '#0B1220',
    },
    emerald: {
      '--primary': '#10B981',
      '--primary-rgb': hexToRgb('#10B981'),
      '--accent': '#6366F1',
      '--accent-rgb': hexToRgb('#6366F1'),
      '--background': '#F8FAFC',
      '--foreground': '#0F172A',
    },
    teal: {
      '--primary': '#14B8A6',
      '--primary-rgb': hexToRgb('#14B8A6'),
      '--accent': '#F59E0B',
      '--accent-rgb': hexToRgb('#F59E0B'),
      '--background': '#F8FAFC',
      '--foreground': '#0F172A',
    },
    indigo: {
      '--primary': '#6366F1',
      '--primary-rgb': hexToRgb('#6366F1'),
      '--accent': '#22C55E',
      '--accent-rgb': hexToRgb('#22C55E'),
      '--background': '#F8FAFC',
      '--foreground': '#0F172A',
    },
    rose: {
      '--primary': '#F43F5E',
      '--primary-rgb': hexToRgb('#F43F5E'),
      '--accent': '#22C55E',
      '--accent-rgb': hexToRgb('#22C55E'),
      '--background': '#FFF1F2',
      '--foreground': '#111827',
    },
    amber: {
      '--primary': '#F59E0B',
      '--primary-rgb': hexToRgb('#F59E0B'),
      '--accent': '#3B82F6',
      '--accent-rgb': hexToRgb('#3B82F6'),
      '--background': '#FFFBEB',
      '--foreground': '#0F172A',
    },
    slate: {
      '--primary': '#0EA5E9',
      '--primary-rgb': hexToRgb('#0EA5E9'),
      '--accent': '#22C55E',
      '--accent-rgb': hexToRgb('#22C55E'),
      '--background': '#0F172A',
      '--foreground': '#E2E8F0',
    },
  };

  let base = palettes[palette] || palettes['gz-dark-accessible'];

  if (palette === 'custom') {
    const primary = opts?.customPrimary || base['--primary'];
    const accent = opts?.customAccent || base['--accent'];
    const background = opts?.customBackground || base['--background'];
    const foreground = opts?.customForeground || base['--foreground'];
    base = {
      '--primary': primary,
      '--primary-rgb': hexToRgb(primary),
      '--accent': accent,
      '--accent-rgb': hexToRgb(accent),
      '--background': background,
      '--foreground': foreground,
    };
  }

  return base;
}

export function varsToStyle(vars: ThemeVars): React.CSSProperties {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return vars as unknown as React.CSSProperties;
}


