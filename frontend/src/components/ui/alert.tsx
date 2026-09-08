import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-fade-up',
  {
    variants: {
      variant: {
        default: 'bg-white text-foreground',
        destructive: 'border-destructive/40 bg-destructive/5 text-destructive',
        success: 'border-emerald-300/60 bg-emerald-50 text-emerald-800',
        info: 'border-sky-300/60 bg-sky-50 text-sky-800',
        warning: 'border-amber-300/60 bg-amber-50 text-amber-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const ICONS: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, LucideIcon | null> = {
  default: null,
  destructive: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, children, ...props }, ref) => {
    const Icon = ICONS[variant || 'default'];
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert };
