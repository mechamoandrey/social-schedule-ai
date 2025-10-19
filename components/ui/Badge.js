// /components/ui/badge.jsx
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // base
  'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        // sólido (primário)
        default:
          'bg-primary text-primary-foreground border-transparent hover:bg-primary/90',
        // sólido (secundário)
        secondary:
          'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/90',
        // destrutivo / erro
        destructive:
          'bg-error text-error-foreground border-error/50 hover:bg-error/90',
        // contornado (usado pela DateBadge)
        outline: 'bg-background text-foreground border-input',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Badge = React.forwardRef(function Badge(
  { className, variant = 'default', ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

export { Badge, badgeVariants };
