import React from 'react';
import type { Message } from '../../types';
import { GlowCard } from '../ui/GlowCard';

const TYPE_COLOR: Record<Message['type'], string> = {
  'agent-agent': '#00ffcc',
  'agent-human': '#00aaff',
  'system': '#ffaa00',
};

const TYPE_LABEL: Record<Message['type'], string> = {
  'agent-agent': 'A↔A',
  'agent-human': 'A↔H',
  'system': 'SYS',
};

interface Props { messages: Message[] }

export const MessageTowerPanel: React.FC<Props> = ({ messages }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {(['agent-agent', 'agent-human', 'system'] as const).map(type => (
          <div key={type} className="flex flex-col items-center p-2 rounded" style={{ background: `${TYPE_COLOR[type]}10`, border: `1px solid ${TYPE_COLOR[type]}22` }}>
            <span style={{ fontSize: 12, color: TYPE_COLOR[type], fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
              {messages.filter(m => m.type === type).length}
            </span>
            <span style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>{TYPE_LABEL[type]}</span>
          </div>
        ))}
      </div>

      {messages.map(msg => {
        const tc = TYPE_COLOR[msg.type];
        return (
          <GlowCard key={msg.id} accent={tc} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 8, color: '#00ffcc', fontFamily: 'Share Tech Mono' }}>{msg.from}</span>
                <span style={{ fontSize: 8, color: '#2a4a6a' }}>→</span>
                <span style={{ fontSize: 8, color: '#8aaccc', fontFamily: 'Share Tech Mono' }}>{msg.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 7, color: tc, background: `${tc}15`, border: `1px solid ${tc}33`, borderRadius: 3, padding: '1px 4px' }}>
                  {TYPE_LABEL[msg.type]}
                </span>
                <span style={{ fontSize: 7, color: '#2a4a6a' }}>{msg.timestamp}</span>
              </div>
            </div>
            <p style={{ fontSize: 9, color: '#8aaccc', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{msg.content}"
            </p>
          </GlowCard>
        );
      })}

      {/* WebSocket hook point */}
      <p style={{ fontSize: 7, color: '#2a4a6a', fontFamily: 'Share Tech Mono', textAlign: 'center' }}>
        {/* Wire up: new WebSocket('wss://agent-bus/messages') to stream live messages */}
        DEMO DATA — CONNECT MESSAGE BUS FOR LIVE CHANNEL STREAM
      </p>
    </div>
  );
};
