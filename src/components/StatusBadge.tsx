import React from 'react';
import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'available':
      case 'completed':
        return 'bg-success/15 text-success border border-success/30';
      case 'on trip':
      case 'dispatched':
      case 'in progress':
        return 'bg-info/15 text-info border border-info/30';
      case 'in shop':
      case 'pending':
        return 'bg-warning/15 text-warning border border-warning/30';
      case 'retired':
      case 'suspended':
      case 'cancelled':
        return 'bg-danger/15 text-danger border border-danger/30';
      case 'off duty':
        return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', getStatusColor(status))}>
      {status}
    </span>
  );
}
