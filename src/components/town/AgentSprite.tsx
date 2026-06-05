import React from 'react';
import type { Agent, AgentStatus } from '../../types';

const TW = 64;
const TH = 32;

interface Props {
  agent: Agent;
  offsetX: number;
  offsetY: number;
  isSelected: boolean;
  onClick: () => void;
}

function toIso(col: number, row: number, ox: number, oy: number) {
  return {
    x: ox + (col - row) * (TW / 2),
    y: oy + (col + row) * (TH / 2),
  };
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: '#00ff88',
  idle: '#888888',
  thinking: '#ffaa00',
  error: '#ff4444',
  sleeping: '#6655ff',
};

// Pixel-art agent sprite drawn with SVG rects
function AgentPixelArt({ color, status }: { color: string; status: AgentStatus }) {
  const s = STATUS_COLORS[status];
  // Simple 12x20 pixel character
  return (
    <g>
      {/* Shadow */}
      <ellipse cx="6" cy="21" rx="6" ry="2" fill="#000" opacity="0.3" />

      {/* Body */}
      <rect x="2" y="9" width="8" height="8" fill={color} rx="1" />
      {/* Arms */}
      <rect x="0" y="10" width="2" height="5" fill={color} opacity="0.8" />
      <rect x="10" y="10" width="2" height="5" fill={color} opacity="0.8" />
      {/* Legs */}
      <rect x="2" y="17" width="3" height="4" fill={color} opacity="0.9" />
      <rect x="7" y="17" width="3" height="4" fill={color} opacity="0.9" />

      {/* Head */}
      <rect x="2" y="2" width="8" height="7" fill={color} rx="2" />
      {/* Visor */}
      <rect x="3" y="4" width="6" height="3" fill={s} opacity="0.9" rx="1" />

      {/* Status dot */}
      <circle cx="11" cy="2" r="2" fill={s} />
      <circle cx="11" cy="2" r="2" fill={s} opacity="0.5">
        <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export const AgentSprite: React.FC<Props> = ({ agent, offsetX, offsetY, isSelected, onClick }) => {
  const { x: cx, y: cy } = toIso(agent.pos.col, agent.pos.row, offsetX, offsetY);

  // Center sprite on tile
  const sx = cx - 6;
  const sy = cy - 26;

  const isWalking = agent.status === 'active' || agent.status === 'thinking';

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      transform={`translate(${sx}, ${sy})`}
    >
      {/* Selection ring */}
      {isSelected && (
        <ellipse
          cx="6" cy="22"
          rx="12" ry="5"
          fill="none"
          stroke={agent.color}
          strokeWidth="1.5"
          opacity="0.8"
        />
      )}

      {/* Walking bounce animation */}
      <g style={isWalking ? { animation: 'agent-walk 0.5s ease-in-out infinite alternate' } : {}}>
        <AgentPixelArt color={agent.color} status={agent.status} />
      </g>

      {/* Name tag */}
      <text
        x="6"
        y="-4"
        textAnchor="middle"
        fontSize="5.5"
        fontFamily="'Share Tech Mono', monospace"
        fill={agent.color}
        opacity={isSelected ? 1 : 0.85}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {agent.name}
      </text>

      {/* Invisible hit area */}
      <rect x="-6" y="-8" width="24" height="32" fill="transparent" />
    </g>
  );
};
