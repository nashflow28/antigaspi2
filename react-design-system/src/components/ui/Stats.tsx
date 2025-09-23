import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Stat {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

interface StatsProps {
  stats: Stat[];
}

const Counter: React.FC<{ value: number }> = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="rounded-3xl border border-primary-500/15 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all dark:bg-neutral-900/80"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-700 dark:text-primary-200">
              {stat.icon}
            </span>
            <span className="text-caption uppercase tracking-[0.18em] text-primary-500">Impact</span>
          </div>

          <div className="mt-4 flex items-baseline gap-2 text-h1 text-primary-700 dark:text-primary-100">
            <Counter value={stat.value} />
            {stat.suffix && <span className="text-small font-medium text-primary-500/80">{stat.suffix}</span>}
          </div>
          <p className="mt-2 text-small text-neutral-500 dark:text-neutral-300">{stat.label}</p>
        </motion.div>
      ))}
    </section>
  );
};

export { Stats };
