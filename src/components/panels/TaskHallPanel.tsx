import React from 'react';
import type { Task } from '../../types';
import { GlowCard } from '../ui/GlowCard';

const STATUS_COLOR: Record<Task['status'], string> = {
  running: '#00ff88',
  queued: '#00aaff',
  done: '#4a6a8a',
  failed: '#ff4444',
};

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  high: '#ff4444',
  medium: '#ffaa00',
  low: '#4a6a8a',
};

interface Props { tasks: Task[] }

export const TaskHallPanel: React.FC<Props> = ({ tasks }) => {
  const running = tasks.filter(t => t.status === 'running').length;
  const queued = tasks.filter(t => t.status === 'queued').length;
  const failed = tasks.filter(t => t.status === 'failed').length;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="RUNNING" value={running} color="#00ff88" />
        <StatChip label="QUEUED" value={queued} color="#00aaff" />
        <StatChip label="FAILED" value={failed} color="#ff4444" />
      </div>

      {/* Task list */}
      {tasks.map(task => {
        const sc = STATUS_COLOR[task.status];
        const pc = PRIORITY_COLOR[task.priority];
        return (
          <GlowCard key={task.id} accent={sc} className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p style={{ fontSize: 9, color: '#c0d0e8', lineHeight: 1.5, flex: 1 }}>{task.title}</p>
              <span style={{ fontSize: 8, color: sc, background: `${sc}15`, border: `1px solid ${sc}33`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                {task.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 8, color: '#4a6a8a' }}>Agent: <span style={{ color: '#8aaccc' }}>{task.agent}</span></span>
              <span style={{ fontSize: 8, color: pc }}>● {task.priority.toUpperCase()}</span>
            </div>
            {task.status === 'running' && (
              <div>
                <div style={{ background: '#1a2744', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${task.progress}%`, height: '100%', background: sc, boxShadow: `0 0 6px ${sc}`, transition: 'width 0.5s' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: 7, color: '#4a6a8a' }}>Started {task.startedAt}</span>
                  <span style={{ fontSize: 7, color: sc }}>{task.progress}% · ETA {task.eta}</span>
                </div>
              </div>
            )}
            {task.status === 'done' && (
              <p style={{ fontSize: 7, color: '#4a6a8a' }}>Completed at {task.startedAt}</p>
            )}
          </GlowCard>
        );
      })}
    </div>
  );
};

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center p-2 rounded" style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
      <span style={{ fontSize: 14, color, fontFamily: 'Share Tech Mono', fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>{label}</span>
    </div>
  );
}
