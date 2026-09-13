import { cn } from '../../lib/utils';
import { BrandLogo } from '../BrandLogo';
import { COMPANY_NAME } from '@shared/const';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export const LoadingSpinner = ({ size = 'md', className, label = 'Loading...' }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <div
        className={cn(
          'animate-spin rounded-full border-[var(--hopstec-teal)] border-t-transparent',
          sizeClasses[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface GradientSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const GradientSpinner = ({ size = 'md', className, label = 'Loading...' }: GradientSpinnerProps) => {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <div className="relative">
        <div
          className={cn(
            'animate-spin rounded-full bg-gradient-to-r from-[var(--hopstec-teal)] via-cyan-400 to-[var(--hopstec-teal)]',
            sizeClasses[size],
            className
          )}
          style={{
            maskImage: 'linear-gradient(transparent 50%, black 50%)',
            WebkitMaskImage: 'linear-gradient(transparent 50%, black 50%)',
          }}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-slate-900',
            size === 'sm' && 'm-[2px]',
            size === 'md' && 'm-[2px]',
            size === 'lg' && 'm-[3px]',
            size === 'xl' && 'm-[4px]'
          )}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader = ({ message = 'Loading Hopstec portal...' }: FullScreenLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b12]">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full bg-gradient-to-r from-[var(--hopstec-teal)] via-cyan-400 to-[var(--hopstec-teal)] p-1">
              <div className="h-full w-full rounded-full bg-[#070b12]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrandLogo size="md" className="animate-pulse shadow-none ring-0" showRing={false} />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">{COMPANY_NAME}</h2>
        <p className="text-sm text-gray-400">{message}</p>

        <div className="mt-4 flex justify-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--hopstec-teal)]" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--hopstec-teal)]" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

interface ButtonSpinnerProps {
  className?: string;
}

export const ButtonSpinner = ({ className }: ButtonSpinnerProps) => {
  return (
    <div
      className={cn('h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
