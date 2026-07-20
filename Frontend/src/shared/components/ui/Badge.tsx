import React from 'react';

type BadgeVariant = 'violet' | 'green' | 'red' | 'amber' | 'slate' | 'blue' | 'pink';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  violet: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  green:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  red:    'bg-red-500/15 text-red-300 border border-red-500/25',
  amber:  'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  slate:  'bg-white/5 text-slate-400 border border-white/10',
  blue:   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  pink:   'bg-pink-500/15 text-pink-300 border border-pink-500/25',
};

const dotStyles: Record<BadgeVariant, string> = {
  violet: 'bg-amber-400',
  green:  'bg-emerald-400',
  red:    'bg-red-400',
  amber:  'bg-amber-400',
  slate:  'bg-slate-400',
  blue:   'bg-blue-400',
  pink:   'bg-pink-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}
