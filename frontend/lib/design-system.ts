// Design System Configuration
// Professional color palette and design tokens for Knowled platform

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Secondary accent colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Role-specific colors
  roles: {
    admin: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fecaca'
    },
    center: {
      bg: '#f0f9ff',
      text: '#1e40af',
      border: '#bfdbfe'
    },
    educator: {
      bg: '#f3e8ff',
      text: '#7c3aed',
      border: '#c4b5fd'
    },
    superEducator: {
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0'
    },
    parent: {
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fde68a'
    },
    schoolViewer: {
      bg: '#f8fafc',
      text: '#475569',
      border: '#e2e8f0'
    }
  }
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  '4xl': '2.5rem', // 40px
  '5xl': '3rem',   // 48px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

// Component variants
export const buttonVariants = {
  primary: {
    bg: colors.primary[500],
    hover: colors.primary[600],
    text: 'white',
    border: colors.primary[500]
  },
  secondary: {
    bg: colors.secondary[100],
    hover: colors.secondary[200],
    text: colors.secondary[700],
    border: colors.secondary[200]
  },
  success: {
    bg: colors.success[500],
    hover: colors.success[600],
    text: 'white',
    border: colors.success[500]
  },
  warning: {
    bg: colors.warning[500],
    hover: colors.warning[600],
    text: 'white',
    border: colors.warning[500]
  },
  error: {
    bg: colors.error[500],
    hover: colors.error[600],
    text: 'white',
    border: colors.error[500]
  }
};

export const cardVariants = {
  default: {
    bg: 'white',
    border: colors.secondary[200],
    shadow: shadows.sm
  },
  elevated: {
    bg: 'white',
    border: colors.secondary[200],
    shadow: shadows.md
  },
  interactive: {
    bg: 'white',
    border: colors.secondary[200],
    shadow: shadows.sm,
    hover: {
      shadow: shadows.lg,
      border: colors.primary[200]
    }
  }
};

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// Utility functions
export const getRoleColor = (role: string) => {
  const roleMap: Record<string, keyof typeof colors.roles> = {
    'ADMIN': 'admin',
    'CENTER': 'center',
    'SPECIAL_EDUCATOR': 'educator',
    'SUPER_SPECIAL_EDUCATOR': 'superEducator',
    'PARENT': 'parent',
    'SCHOOL_VIEWER': 'schoolViewer'
  };
  
  return colors.roles[roleMap[role]] || colors.roles.center;
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'approved':
      return colors.success;
    case 'pending':
    case 'in_progress':
      return colors.warning;
    case 'inactive':
    case 'rejected':
    case 'failed':
      return colors.error;
    default:
      return colors.secondary;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
      return colors.error;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.success;
    default:
      return colors.secondary;
  }
};
