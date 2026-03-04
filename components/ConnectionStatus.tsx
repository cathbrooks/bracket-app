'use client';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionState } from '@/lib/realtime/config';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  state: ConnectionState;
  className?: string;
}

const stateConfig: Record<
  ConnectionState,
  { icon: typeof Wifi; label: string; color: string }
> = {
  connected: {
    icon: Wifi,
    label: 'Live',
    color: 'text-green-600',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting...',
    color: 'text-yellow-600',
  },
  reconnecting: {
    icon: Loader2,
    label: 'Reconnecting...',
    color: 'text-yellow-600',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Offline',
    color: 'text-destructive',
  },
};

export function ConnectionStatus({ state, className }: ConnectionStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isAnimated = state === 'connecting' || state === 'reconnecting';

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', config.color, className)}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <Icon className={cn('h-3.5 w-3.5', isAnimated && 'animate-spin')} />
      <span>{config.label}</span>
    </div>
  );
}
