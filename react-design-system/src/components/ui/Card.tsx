import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  [
    "relative overflow-hidden rounded-2xl border transition-all duration-300",
    "backdrop-blur-sm bg-gradient-to-br"
  ],
  {
    variants: {
      variant: {
        default: [
          "from-gray-900/40 via-gray-900/30 to-gray-800/40",
          "border-gray-700/50 hover:border-gray-600/60",
          "shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
        ],
        glass: [
          "from-white/5 via-white/10 to-white/5",
          "border-white/10 hover:border-white/20",
          "shadow-2xl shadow-black/40 hover:shadow-black/50",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none"
        ],
        primary: [
          "from-brand-900/20 via-brand-800/30 to-brand-900/20",
          "border-brand-500/30 hover:border-brand-400/50",
          "shadow-lg shadow-brand-900/30 hover:shadow-xl hover:shadow-brand-800/40"
        ],
        accent: [
          "from-accent-900/20 via-accent-800/30 to-accent-900/20",
          "border-accent-500/30 hover:border-accent-400/50",
          "shadow-lg shadow-accent-900/30 hover:shadow-xl hover:shadow-accent-800/40"
        ]
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10"
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:scale-[1.02]",
        glow: "hover:shadow-glow transition-shadow duration-500"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "lift"
    }
  }
);

interface CardProps
  extends Omit<HTMLMotionProps<"div">, "size">,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn(cardVariants({ variant, size, hover, className }))}
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={hover === "lift" ? { y: -4, scale: 1.02 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  )
);

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)}
      {...props}
    />
  )
);

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-400 leading-relaxed", className)}
      {...props}
    />
  )
);

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 border-t border-gray-700/50", className)}
      {...props}
    />
  )
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardFooter.displayName = "CardFooter";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type { CardProps };