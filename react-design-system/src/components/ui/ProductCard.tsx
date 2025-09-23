import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface ProductCardProps {
  image: string;
  name: string;
  merchant: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  quantity?: string;
  onReserve?: () => void;
  tags?: string[];
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  merchant,
  price,
  originalPrice,
  discount,
  quantity,
  onReserve,
  tags,
  className,
}) => {
  return (
    <motion.article
      className={cn('group relative flex flex-col overflow-hidden rounded-3xl border border-primary-500/15 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:bg-neutral-900', className)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-label={`Réserver ${name}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img src={image} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {discount && (
          <span className="absolute left-4 top-4 rounded-full bg-primary-700 px-3 py-1 text-caption font-semibold text-neutral-50 shadow-card">
            {discount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-1">
          <h3 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">{name}</h3>
          <p className="text-small text-neutral-500 dark:text-neutral-300">{merchant}</p>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary-500/10 px-3 py-1 text-caption text-primary-700 dark:text-primary-200">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-caption uppercase tracking-wide text-primary-500">Prix anti-gaspi</p>
            <div className="flex items-baseline gap-2">
              <span className="text-h2 font-semibold text-primary-700 dark:text-primary-200">{price}</span>
              {originalPrice && <span className="text-small text-neutral-400 line-through">{originalPrice}</span>}
            </div>
            {quantity && <p className="text-caption text-neutral-500">{quantity}</p>}
          </div>

          <Button variant="primary" onClick={onReserve} aria-label={`Réserver ${name}`}>
            Réserver
          </Button>
        </div>
      </div>
    </motion.article>
  );
};

export { ProductCard };
export type { ProductCardProps };
