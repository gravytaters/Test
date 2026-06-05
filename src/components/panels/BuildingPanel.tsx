import React from 'react';
import { motion } from 'framer-motion';
import type { Building, BuildingType } from '../../types';
import type { Task, LogEntry, Tool, MemoryEntry, TokenUsage, Message, ScheduledJob } from '../../types';
import { TaskHallPanel } from './TaskHallPanel';
import { LogsLibraryPanel } from './LogsLibraryPanel';
import { ToolWorkshopPanel } from './ToolWorkshopPanel';
import { MemoryArchivePanel } from './MemoryArchivePanel';
import { TokenBankPanel } from './TokenBankPanel';
import { MessageTowerPanel } from './MessageTowerPanel';
import { SchedulerPanel } from './SchedulerPanel';

interface Props {
  building: Building;
  onClose: () => void;
  tasks: Task[];
  logs: LogEntry[];
  tools: Tool[];
  memories: MemoryEntry[];
  tokenUsage: TokenUsage[];
  messages: Message[];
  jobs: ScheduledJob[];
}

function PanelContent({ id, ...props }: { id: BuildingType } & Omit<Props, 'building' | 'onClose'>) {
  switch (id) {
    case 'task-hall': return <TaskHallPanel tasks={props.tasks} />;
    case 'logs-library': return <LogsLibraryPanel logs={props.logs} />;
    case 'tool-workshop': return <ToolWorkshopPanel tools={props.tools} />;
    case 'memory-archive': return <MemoryArchivePanel memories={props.memories} />;
    case 'token-bank': return <TokenBankPanel tokenUsage={props.tokenUsage} />;
    case 'message-tower': return <MessageTowerPanel messages={props.messages} />;
    case 'scheduler': return <SchedulerPanel jobs={props.jobs} />;
    default: return null;
  }
}

export const BuildingPanel: React.FC<Props> = ({ building, onClose, ...rest }) => {
  const { name, icon, accentColor, description } = building;

  return (
    <motion.aside
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col"
      style={{
        width: 340,
        height: '100%',
        background: 'rgba(8,11,20,0.97)',
        borderLeft: `1px solid ${accentColor}33`,
        boxShadow: `-8px 0 32px rgba(0,0,0,0.5), inset 1px 0 0 ${accentColor}11`,
        fontFamily: 'Share Tech Mono, monospace',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between shrink-0"
        style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${accentColor}22` }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 20 }}>{icon}</span>
            <h2 style={{ color: accentColor, fontSize: 10, fontFamily: "'Press Start 2P'", letterSpacing: 0.5 }}>
              {name}
            </h2>
          </div>
          <p style={{ fontSize: 8, color: '#4a6a8a', marginTop: 4, lineHeight: 1.5 }}>{description}</p>
        </div>
        <button
          onClick={onClose}
          style={{ color: '#4a6a8a', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
        <PanelContent id={building.id} {...rest} />
      </div>
    </motion.aside>
  );
};
