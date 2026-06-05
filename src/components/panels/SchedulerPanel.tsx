import React from 'react';
import type { ScheduledJob } from '../../types';
import { GlowCard } from '../ui/GlowCard';

const STATUS_COLOR: Record<ScheduledJob['status'], string> = {
  scheduled: '#00aaff',
  running: '#00ff88',
  paused: '#ffaa00',
};

interface Props { jobs: ScheduledJob[] }

export const SchedulerPanel: React.FC<Props> = ({ jobs }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {(['scheduled', 'running', 'paused'] as const).map(s => (
          <div key={s} className="flex flex-col items-center p-2 rounded" style={{ background: `${STATUS_COLOR[s]}10`, border: `1px solid ${STATUS_COLOR[s]}22` }}>
            <span style={{ fontSize: 12, color: STATUS_COLOR[s], fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
              {jobs.filter(j => j.status === s).length}
            </span>
            <span style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2, textTransform: 'uppercase' }}>{s}</span>
          </div>
        ))}
      </div>

      {jobs.map(job => {
        const sc = STATUS_COLOR[job.status];
        return (
          <GlowCard key={job.id} accent={sc} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 10, color: '#c0d0e8', fontFamily: 'Share Tech Mono' }}>{job.name}</span>
              <span style={{ fontSize: 8, color: sc, background: `${sc}15`, border: `1px solid ${sc}33`, borderRadius: 3, padding: '1px 5px' }}>
                {job.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Info label="AGENT" value={job.agent} color="#8aaccc" />
              <Info label="CRON" value={job.cron} color="#aa55ff" />
              <Info label="NEXT RUN" value={job.nextRun} color={sc} />
              <Info label="LAST RUN" value={job.lastRun} color="#4a6a8a" />
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
};

function Info({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: 7, color: '#2a4a6a' }}>{label}</p>
      <p style={{ fontSize: 8, color, fontFamily: 'Share Tech Mono', marginTop: 1 }}>{value}</p>
    </div>
  );
}
