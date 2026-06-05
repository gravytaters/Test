import React, { useRef, useState } from 'react';
import type { Agent, Building, SelectionType } from '../../types';
import { IsometricBuilding } from './IsometricBuilding';
import { AgentSprite } from './AgentSprite';

const TW = 64;
const TH = 32;
const GRID_COLS = 14;
const GRID_ROWS = 11;

// Ground tile color variations for visual texture
const TILE_COLORS = [
  '#111827', '#131c30', '#121a2e', '#0f1826',
];

function toIso(col: number, row: number, ox: number, oy: number) {
  return {
    x: ox + (col - row) * (TW / 2),
    y: oy + (col + row) * (TH / 2),
  };
}

function tilePoly(col: number, row: number, ox: number, oy: number) {
  const { x: cx, y: cy } = toIso(col, row, ox, oy);
  return [
    `${cx},${cy - TH / 2}`,
    `${cx + TW / 2},${cy}`,
    `${cx},${cy + TH / 2}`,
    `${cx - TW / 2},${cy}`,
  ].join(' ');
}

// Road tiles connecting buildings
const ROAD_TILES = new Set([
  '5,3','5,4','5,5','5,6','5,7',
  '4,4','5,4','6,4','7,4','8,4',
  '7,5','7,6','7,7','7,8',
  '3,6','4,6','5,6','6,6',
  '9,4','9,5','9,6','9,7',
  '10,3','10,4','10,5',
  '5,2','5,1',
]);

interface Props {
  agents: Agent[];
  buildings: Building[];
  selection: SelectionType;
  onSelectAgent: (id: string) => void;
  onSelectBuilding: (id: Building['id']) => void;
}

export const TownMap: React.FC<Props> = ({
  agents, buildings, selection, onSelectAgent, onSelectBuilding,
}) => {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Map dimensions: accommodate the full grid + building heights
  const svgW = (GRID_COLS + GRID_ROWS) * (TW / 2) + TW;
  const svgH = (GRID_COLS + GRID_ROWS) * (TH / 2) + 200;

  // Offset so col=0,row=0 starts at top-center
  const offsetX = GRID_ROWS * (TW / 2) + TW / 2;
  const offsetY = 120; // space for tall buildings above

  // Render order: tiles are sorted by (col + row) so back tiles render first
  const tileOrder: [number, number][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      tileOrder.push([col, row]);
    }
  }
  tileOrder.sort(([c1, r1], [c2, r2]) => (c1 + r1) - (c2 + r2));

  // Buildings sorted by render depth
  const sortedBuildings = [...buildings].sort(
    (a, b) => (a.pos.col + a.pos.row) - (b.pos.col + b.pos.row)
  );

  // Agents sorted by depth
  const sortedAgents = [...agents].sort(
    (a, b) => (a.pos.col + a.pos.row) - (b.pos.col + b.pos.row)
  );

  return (
    <div className="town-map-container" style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        style={{ display: 'block', margin: '0 auto' }}
      >
        <defs>
          {/* Grid line pattern */}
          <pattern id="grid-dots" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.4" fill="#1e3050" />
          </pattern>

          {/* Ambient glow filter */}
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Road texture */}
          <pattern id="road-stripe" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="8" y2="8" stroke="#1a2a40" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Background fill */}
        <rect width={svgW} height={svgH} fill="#080b14" />

        {/* Ground layer */}
        {tileOrder.map(([col, row]) => {
          const isRoad = ROAD_TILES.has(`${col},${row}`);
          const poly = tilePoly(col, row, offsetX, offsetY);
          const colorIdx = (col * 3 + row * 7) % TILE_COLORS.length;
          return (
            <g key={`tile-${col}-${row}`}>
              <polygon
                points={poly}
                fill={isRoad ? '#0d1a2e' : TILE_COLORS[colorIdx]}
                stroke="#1a2744"
                strokeWidth="0.5"
              />
              {isRoad && (
                <polygon points={poly} fill="url(#road-stripe)" opacity="0.3" />
              )}
            </g>
          );
        })}

        {/* Buildings (back-to-front) */}
        {sortedBuildings.map(b => (
          <IsometricBuilding
            key={b.id}
            building={b}
            offsetX={offsetX}
            offsetY={offsetY}
            isSelected={selection?.kind === 'building' && selection.id === b.id}
            isHovered={hoveredBuilding === b.id}
            onClick={() => onSelectBuilding(b.id)}
            onMouseEnter={() => setHoveredBuilding(b.id)}
            onMouseLeave={() => setHoveredBuilding(null)}
          />
        ))}

        {/* Agents (back-to-front) */}
        {sortedAgents.map(agent => (
          <AgentSprite
            key={agent.id}
            agent={agent}
            offsetX={offsetX}
            offsetY={offsetY}
            isSelected={selection?.kind === 'agent' && selection.id === agent.id}
            onClick={() => onSelectAgent(agent.id)}
          />
        ))}

        {/* Corner watermark */}
        <text x="12" y="20" fontFamily="'Share Tech Mono'" fontSize="9" fill="#1e3a5a" opacity="0.6">
          AGENTTOWN v0.1 // DEMO MODE
        </text>
      </svg>
    </div>
  );
};
