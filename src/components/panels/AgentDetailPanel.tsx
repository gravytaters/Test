import React from 'react';
import { motion } from 'framer-motion';
import type { Agent } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { GlowCard } from '../ui/GlowCard';

interface Props {
  agent: Agent;
  onClose: () => void;
}

export const AgentDetailPanel: React.FC<Props> = ({ agent, onClose }) => {
  const pct = Math.round((agent.tokenUsage.used / agent.tokenUsage.limit) * 100);
  const barColor = pct > 80 ? '#ff4444' : pct > 60 ? '#ffaa00' : '#00ff88';

  return (
    <motion.aside
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col gap-3 overflow-y-auto"
      style={{
        width: 320,
        height: '100%',
        padding: '16px 14px',
        background: 'rgba(8,11,20,0.97)',
        borderLeft: `1px solid ${agent.color}33`,
        boxShadow: `-8px 0 32px rgba(0,0,0,0.5), inset 1px 0 0 ${agent.color}11`,
        fontFamily: 'Share Tech Mono, monospace',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 18, color: agent.color }}>◈</span>
            <h2 style={{ color: agent.color, fontSize: 13, fontFamily: "'Press Start 2P'", letterSpacing: 1 }}>
              {agent.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={agent.status} />
            <span style={{ fontSize: 9, color: '#4a6a8a' }}>UP {agent.uptime}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ color: '#4a6a8a', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${agent.color}22` }} />

      {/* Model */}
      <Row label="MODEL" value={agent.model} accent={agent.color} />

      {/* Active task */}
      <GlowCard accent={agent.color} className="p-3">
        <Label text="ACTIVE TASK" color={agent.color} />
        <p style={{ fontSize: 10, color: '#c0d0e8', marginTop: 6, lineHeight: 1.6 }}>{agent.activeTask}</p>
      </GlowCard>

      {/* Token usage */}
      <GlowCard accent={barColor} className="p-3">
        <div className="flex justify-between items-center mb-2">
          <Label text="TOKEN USAGE" color={barColor} />
          <span style={{ fontSize: 9, color: barColor }}>{pct}%</span>
        </div>
        <div style={{ background: '#1a2744', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: barColor, boxShadow: `0 0 8px ${barColor}` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 8, color: '#4a6a8a' }}>{agent.tokenUsage.used.toLocaleString()} used</span>
          <span style={{ fontSize: 8, color: '#4a6a8a' }}>{agent.tokenUsage.limit.toLocaleString()} limit</span>
        </div>
      </GlowCard>

      {/* Recent actions */}
      <GlowCard accent="#00aaff" className="p-3">
        <Label text="RECENT ACTIONS" color="#00aaff" />
        <ul className="mt-2 flex flex-col gap-1.5">
          {agent.recentActions.map((action, i) => (
            <li key={i} className="flex items-start gap-2" style={{ fontSize: 9, color: '#8aaccc', lineHeight: 1.5 }}>
              <span style={{ color: '#00aaff', flexShrink: 0 }}>›</span>
              {action}
            </li>
          ))}
        </ul>
      </GlowCard>

      {/* Last message */}
      <GlowCard accent="#aa55ff" className="p-3">
        <Label text="LAST MESSAGE" color="#aa55ff" />
        <p style={{ fontSize: 9, color: '#c0b0e8', marginTop: 6, lineHeight: 1.6, fontStyle: 'italic' }}>
          "{agent.lastMessage}"
        </p>
      </GlowCard>

      {/* Tools */}
      <GlowCard accent="#ff6600" className="p-3">
        <Label text="AVAILABLE TOOLS" color="#ff6600" />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {agent.tools.map(t => (
            <span
              key={t}
              style={{
                fontSize: 8,
                color: '#ff9955',
                background: 'rgba(255,102,0,0.12)',
                border: '1px solid rgba(255,102,0,0.25)',
                borderRadius: 4,
                padding: '2px 6px',
                fontFamily: 'Share Tech Mono',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </GlowCard>
    </motion.aside>
  );
};

function Label({ text, color }: { text: string; color: string }) {
  return <p style={{ fontSize: 8, color, letterSpacing: 1, fontWeight: 700 }}>{text}</p>;
}

function Row({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 8, color: '#4a6a8a' }}>{label}</span>
      <span style={{ fontSize: 9, color: accent }}>{value}</span>
    </div>
  );
}
