export const shadows = {
  // Subtle shadow for cards on light background
  subtle: {
    shadowColor: '#D4A547', // Warm gold tint
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2, // Android
  },

  // Medium shadow for elevated cards
  medium: {
    shadowColor: '#8B5CF6', // Purple tint
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },

  // Strong shadow for modals
  strong: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 8,
  },

  // Glow effect (for cosmic elements)
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
} as const;
