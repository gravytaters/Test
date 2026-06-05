import React from 'react';
import type { Tool } from '../../types';
import { GlowCard } from '../ui/GlowCard';

const STATUS_COLOR: Record<Tool['status'], string> = {
  healthy: '#00ff88',
  degraded: '#ffaa00',
  offline: '#ff4444',
};

interface Props { tools: Tool[] }

export const ToolWorkshopPanel: React.FC<Props> = ({ tools }) => {
  const healthy = tools.filter(t => t.status === 'healthy').length;
  const degraded = tools.filter(t => t.status === 'degraded').length;
  const offline = tools.filter(t => t.status === 'offline').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Chip label="HEALTHY" value={healthy} color="#00ff88" />
        <Chip label="DEGRADED" value={degraded} color="#ffaa00" />
        <Chip label="OFFLINE" value={offline} color="#ff4444" />
      </div>

      {tools.map(tool => {
        const sc = STATUS_COLOR[tool.status];
        return (
          <GlowCard key={tool.id} accent={sc} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 6, color: sc, background: `${sc}15`, border: `1px solid ${sc}33`, borderRadius: 3, padding: '1px 5px' }}>
                  {tool.category.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: '#c0d0e8', fontFamily: 'Share Tech Mono' }}>{tool.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, boxShadow: `0 0 4px ${sc}`, display: 'inline-block' }} />
                <span style={{ fontSize: 8, color: sc }}>{tool.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="CALLS TODAY" value={tool.callsToday.toString()} color="#00aaff" />
              <Metric label="AVG LATENCY" value={tool.avgLatency} color={tool.status === 'degraded' ? '#ffaa00' : '#8aaccc'} />
              <Metric label="LAST USED" value={tool.lastUsed} color="#4a6a8a" />
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
};

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center p-2 rounded" style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
      <span style={{ fontSize: 13, color, fontFamily: 'Share Tech Mono', fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>{label}</span>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: 7, color: '#4a6a8a' }}>{label}</p>
      <p style={{ fontSize: 9, color, marginTop: 1 }}>{value}</p>
    </div>
  );
}
