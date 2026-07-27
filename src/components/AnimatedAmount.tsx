'use client';

import { useCountUp } from '@/hooks/useCountUp';
import { formatCurrency } from '@/lib/format';

export function AnimatedAmount({
  value,
  hidden,
  className = '',
}: {
  value: number;
  hidden: boolean;
  className?: string;
}) {
  const animated = useCountUp(value);
  if (hidden) return <span className={className}>R$ ••••••</span>;
  return <span className={className}>{formatCurrency(animated)}</span>;
}
