import { Variants } from 'framer-motion';

// Page Transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

// Stagger Animations
export const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  }
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

// Card Animations
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

export const cardTapVariants: Variants = {
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Modal Animations
export const modalBackdropVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    y: 20,
    transition: {
      duration: 0.3
    }
  }
};

// Button Animations
export const buttonVariants: Variants = {
  rest: {
    scale: 1
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Loading Spinner
export const spinnerVariants: Variants = {
  start: {
    rotate: 0
  },
  end: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Slide Animations
export const slideInVariants = {
  left: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  },
  right: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 }
  },
  up: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 }
  },
  down: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 }
  }
};

// Fade Animations
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Scale Animations
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3
    }
  }
};

// Bounce Animation
export const bounceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.68, -0.55, 0.265, 1.55]
    }
  }
};

// Notification Animations
export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.3
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.3,
    transition: {
      duration: 0.2
    }
  }
};

// Sidebar Animations
export const sidebarVariants: Variants = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 40
    }
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 40
    }
  }
};

// Navigation Item Animations
export const navItemVariants: Variants = {
  rest: {
    x: 0,
    scale: 1
  },
  hover: {
    x: 4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98
  }
};

// Custom Easing Functions
export const customEasing = {
  gentle: [0.25, 0.46, 0.45, 0.94],
  smooth: [0.23, 1, 0.32, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0.0, 0.0, 0.2, 1.0]
};

// Animation Presets
export const animationPresets = {
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  verySlow: { duration: 0.8 }
};

// Hover Effects
export const hoverEffect = {
  scale: { scale: 1.05 },
  lift: { y: -4, scale: 1.02 },
  glow: { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
  rotate: { rotate: 5 },
  wobble: {
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.5 }
  }
};

// Loading States
export const loadingVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  shimmer: {
    x: ['-100%', '100%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};