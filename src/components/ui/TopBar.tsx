import React from 'react';
import type { Agent } from '../../types';

interface Props {
  agents: Agent[];
}

export const TopBar: React.FC<Props> = ({ agents }) => {
  const active = agents.filter(a => a.status === 'active').length;
  const errors = agents.filter(a => a.status === 'error').length;
  const totalTokens = agents.reduce((s, a) => s + a.tokenUsage.used, 0);

  return (
    <header
      className="flex items-center justify-between px-4 py-2 shrink-0"
      style={{
        background: 'rgba(8,11,20,0.95)',
        borderBottom: '1px solid #1e3a5a',
        boxShadow: '0 1px 16px rgba(0,170,255,0.08)',
        backdropFilter: 'blur(8px)',
        height: 48,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="text-xs font-bold"
          style={{ fontFamily: "'Press Start 2P'", color: '#00ff88', fontSize: 10, letterSpacing: 1 }}
        >
          AGENT<span style={{ color: '#00aaff' }}>TOWN</span>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#ffaa00', background: 'rgba(255,170,0,0.12)', border: '1px solid #ffaa0033' }}
        >
          DEMO
        </span>
      </div>

      {/* Status strip */}
      <div className="flex items-center gap-5">
        <Stat label="AGENTS" value={`${agents.length}`} color="#00aaff" />
        <Stat label="ACTIVE" value={`${active}`} color="#00ff88" />
        {errors > 0 && <Stat label="ERRORS" value={`${errors}`} color="#ff4444" />}
        <Stat label="TOKENS TODAY" value={totalTokens.toLocaleString()} color="#ffdd00" />
        <LiveIndicator />
      </div>
    </header>
  );
};

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6a8a' }}>{label}</span>
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="rounded-full"
        style={{
          width: 6, height: 6,
          background: '#00ff88',
          boxShadow: '0 0 6px #00ff88',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
          display: 'inline-block',
        }}
      />
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#00ff88' }}>LIVE</span>
    </div>
  );
}
