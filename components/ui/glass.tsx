// components/ui/glass.tsx
import { cn } from '@/lib/utils';

export const Glass = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10",
        className
      )}
      {...props}
    />
  );
};
