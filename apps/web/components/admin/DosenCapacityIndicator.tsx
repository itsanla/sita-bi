'use client';

import DosenCapacityBadge from '../shared/DosenCapacityBadge';

interface DosenCapacityIndicatorProps {
  current: number;
  max?: number;
}

export function DosenCapacityIndicator({
  current,
  max = 4,
}: DosenCapacityIndicatorProps) {
  return <DosenCapacityBadge current={current} max={max} />;
}
