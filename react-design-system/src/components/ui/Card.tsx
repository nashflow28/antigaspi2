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
            "from-white/70 via-white/60 to-white/70 dark:from-gray-800/40 dark:via-gray-800/30 dark:to-gray-800/40",
            "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
            "shadow-lg shadow-gray-200/60 hover:shadow-xl hover:shadow-gray-300/60 dark:shadow-black/20 dark:hover:shadow-black/30"
          ],
          glass: [
            "from-white/20 via-white/30 to-white/20 dark:from-gray-700/20 dark:via-gray-700/30 dark:to-gray-700/20",
            "border-white/40 dark:border-gray-600",
            "shadow-2xl shadow-gray-200/40 hover:shadow-gray-300/50 dark:shadow-black/40 dark:hover:shadow-black/50",
            "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
          ],
          primary: [
            "from-brand-50 to-accent-50",
            "border-brand-200 hover:border-brand-300",
            "shadow-lg shadow-brand-200/50 hover:shadow-brand-300/60"
          ],
          accent: [
            "from-accent-50 to-accent-100",
            "border-accent-200 hover:border-accent-300",
            "shadow-lg shadow-accent-200/50 hover:shadow-accent-300/60"
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
        className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white", className)}
        {...props}
      />
  )
);

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
      <p
        ref={ref}
        className={cn("text-sm text-gray-600 dark:text-gray-400 leading-relaxed", className)}
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
      className={cn("flex items-center pt-4 border-t border-gray-200 dark:border-gray-700", className)}
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