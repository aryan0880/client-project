import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const config: Record<AlertVariant, { classes: string; Icon: React.ElementType }> = {
  info:    { classes: 'bg-primary-50 border-primary-200 text-primary-800', Icon: Info },
  success: { classes: 'bg-success-50 border-success-200 text-success-700', Icon: CheckCircle },
  warning: { classes: 'bg-warning-50 border-warning-200 text-warning-700', Icon: AlertTriangle },
  error:   { classes: 'bg-danger-50 border-danger-200 text-danger-700',   Icon: AlertCircle },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { classes, Icon } = config[variant];
  return (
    <div className={clsx('flex gap-3 p-4 rounded border text-sm', classes, className)}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
