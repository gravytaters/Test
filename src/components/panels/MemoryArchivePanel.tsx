import React from 'react';
import type { MemoryEntry } from '../../types';
import { GlowCard } from '../ui/GlowCard';

const TYPE_COLOR: Record<MemoryEntry['type'], string> = {
  episodic: '#aa55ff',
  semantic: '#00aaff',
  working: '#ffaa00',
};

interface Props { memories: MemoryEntry[] }

export const MemoryArchivePanel: React.FC<Props> = ({ memories }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {(['episodic', 'semantic', 'working'] as const).map(type => (
          <div key={type} className="flex flex-col items-center p-2 rounded" style={{ background: `${TYPE_COLOR[type]}10`, border: `1px solid ${TYPE_COLOR[type]}22` }}>
            <span style={{ fontSize: 12, color: TYPE_COLOR[type], fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
              {memories.filter(m => m.type === type).length}
            </span>
            <span style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2, textTransform: 'uppercase' }}>{type}</span>
          </div>
        ))}
      </div>

      {memories.map(mem => {
        const tc = TYPE_COLOR[mem.type];
        return (
          <GlowCard key={mem.id} accent={tc} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 7, color: tc, background: `${tc}15`, border: `1px solid ${tc}33`, borderRadius: 3, padding: '1px 5px' }}>
                  {mem.type.toUpperCase()}
                </span>
                <span style={{ fontSize: 8, color: '#4a6a8a' }}>{mem.agent}</span>
              </div>
              <span style={{ fontSize: 7, color: '#2a4a6a' }}>{mem.size}</span>
            </div>
            <p style={{ fontSize: 9, color: '#8aaacc', fontFamily: 'Share Tech Mono', marginBottom: 4 }}>
              <span style={{ color: tc }}>›</span> {mem.key}
            </p>
            <p style={{ fontSize: 8, color: '#6a8aaa', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{mem.preview}"
            </p>
            <div className="flex gap-4 mt-2">
              <span style={{ fontSize: 7, color: '#2a4a6a' }}>Created {mem.created}</span>
              <span style={{ fontSize: 7, color: '#2a4a6a' }}>Accessed {mem.accessed}</span>
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
};
