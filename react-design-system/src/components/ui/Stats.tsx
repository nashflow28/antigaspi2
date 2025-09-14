import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Stat {
  icon: React.ReactNode;
  value: number;
  label: string;
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
    <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-lg flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="text-primary-600 mb-2">{stat.icon}</div>
          <div className="text-3xl font-bold text-primary-700 dark:text-primary-400">
            <Counter value={stat.value} />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
        </motion.div>
      ))}
    </section>
  );
};

export { Stats };
