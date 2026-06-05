import React, { useState } from 'react';
import type { LogEntry } from '../../types';

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  info: '#00aaff',
  warn: '#ffaa00',
  error: '#ff4444',
  debug: '#6b7a99',
};

interface Props { logs: LogEntry[] }

export const LogsLibraryPanel: React.FC<Props> = ({ logs }) => {
  const [filter, setFilter] = useState<LogEntry['level'] | 'all'>('all');

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex gap-2">
        {(['all', 'info', 'warn', 'error', 'debug'] as const).map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            style={{
              fontSize: 8,
              fontFamily: 'Share Tech Mono',
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${filter === lvl ? (lvl === 'all' ? '#00aaff' : LEVEL_COLOR[lvl as LogEntry['level']]) : '#1e3a5a'}`,
              background: filter === lvl ? 'rgba(0,170,255,0.1)' : 'transparent',
              color: filter === lvl ? (lvl === 'all' ? '#00aaff' : LEVEL_COLOR[lvl as LogEntry['level']]) : '#4a6a8a',
              cursor: 'pointer',
            }}
          >
            {lvl.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div
        className="flex flex-col gap-1 rounded-lg overflow-y-auto"
        style={{
          background: 'rgba(6,10,20,0.8)',
          border: '1px solid #1e3a5a',
          padding: '8px',
          maxHeight: 480,
          fontFamily: 'Share Tech Mono',
        }}
      >
        {filtered.map(log => (
          <div key={log.id} className="flex items-start gap-2 py-1" style={{ borderBottom: '1px solid #0e1c30' }}>
            <span style={{ fontSize: 8, color: '#2a4a6a', flexShrink: 0, minWidth: 52 }}>{log.timestamp}</span>
            <span
              style={{
                fontSize: 8,
                color: LEVEL_COLOR[log.level],
                background: `${LEVEL_COLOR[log.level]}15`,
                border: `1px solid ${LEVEL_COLOR[log.level]}33`,
                borderRadius: 3,
                padding: '0 4px',
                flexShrink: 0,
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {log.level.toUpperCase()}
            </span>
            <span style={{ fontSize: 8, color: '#4a6a9a', flexShrink: 0, minWidth: 36 }}>{log.agent}</span>
            <span style={{ fontSize: 8, color: '#8aaccc', lineHeight: 1.5 }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
