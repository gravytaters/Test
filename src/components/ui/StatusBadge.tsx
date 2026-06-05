import React from 'react';
import type { AgentStatus } from '../../types';

const CONFIG: Record<AgentStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: 'ACTIVE',    color: '#00ff88', bg: 'rgba(0,255,136,0.12)', dot: '#00ff88' },
  thinking: { label: 'THINKING',  color: '#ffaa00', bg: 'rgba(255,170,0,0.12)', dot: '#ffaa00' },
  idle:     { label: 'IDLE',      color: '#6b7a99', bg: 'rgba(107,122,153,0.12)', dot: '#6b7a99' },
  sleeping: { label: 'SLEEPING',  color: '#6655ff', bg: 'rgba(102,85,255,0.12)', dot: '#6655ff' },
  error:    { label: 'ERROR',     color: '#ff4444', bg: 'rgba(255,68,68,0.12)', dot: '#ff4444' },
};

export const StatusBadge: React.FC<{ status: AgentStatus; small?: boolean }> = ({ status, small }) => {
  const c = CONFIG[status];
  const size = small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-bold ${size}`}
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}33` }}
    >
      <span
        className="rounded-full"
        style={{
          width: small ? 5 : 6,
          height: small ? 5 : 6,
          background: c.dot,
          boxShadow: `0 0 4px ${c.dot}`,
          display: 'inline-block',
          animation: status === 'active' || status === 'thinking' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {c.label}
    </span>
  );
};
