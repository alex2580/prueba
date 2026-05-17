'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children, variant = 'primary', size = 'md', loading, disabled, className, ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all whitespace-nowrap border-none';
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-2xl px-4 py-2',
  };
  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-5 py-3',
    lg: 'text-base px-6 py-3.5',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <span className="animate-spin text-base">⟳</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
