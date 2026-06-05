export type AgentStatus = 'active' | 'idle' | 'thinking' | 'error' | 'sleeping';

export type BuildingType =
  | 'task-hall'
  | 'logs-library'
  | 'tool-workshop'
  | 'memory-archive'
  | 'token-bank'
  | 'message-tower'
  | 'scheduler';

export interface GridPos {
  col: number;
  row: number;
}

export interface Agent {
  id: string;
  name: string;
  color: string;
  status: AgentStatus;
  activeTask: string;
  recentActions: string[];
  tokenUsage: { used: number; limit: number };
  tools: string[];
  lastMessage: string;
  pos: GridPos;
  targetPos: GridPos;
  model: string;
  uptime: string;
}

export interface Building {
  id: BuildingType;
  name: string;
  icon: string;
  pos: GridPos;
  color: string;
  accentColor: string;
  height: number;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  agent: string;
  status: 'running' | 'queued' | 'done' | 'failed';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  startedAt: string;
  eta: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  agent: string;
  message: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  callsToday: number;
  avgLatency: string;
  status: 'healthy' | 'degraded' | 'offline';
  lastUsed: string;
}

export interface MemoryEntry {
  id: string;
  agent: string;
  type: 'episodic' | 'semantic' | 'working';
  key: string;
  preview: string;
  size: string;
  created: string;
  accessed: string;
}

export interface TokenUsage {
  agent: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'agent-agent' | 'agent-human' | 'system';
}

export interface ScheduledJob {
  id: string;
  name: string;
  agent: string;
  cron: string;
  nextRun: string;
  lastRun: string;
  status: 'scheduled' | 'running' | 'paused';
}

export type SelectionType = { kind: 'agent'; id: string } | { kind: 'building'; id: BuildingType } | null;
