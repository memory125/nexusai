import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-400`} />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
  );
}

interface SuspenseFallbackProps {
  minHeight?: string;
}

export function SuspenseFallback({ minHeight = '200px' }: SuspenseFallbackProps) {
  return (
    <div 
      className="flex items-center justify-center" 
      style={{ minHeight }}
    >
      <LoadingSpinner size="lg" />
    </div>
  );
}