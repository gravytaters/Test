import React from 'react';
import type { Building } from '../../types';

const TW = 64; // tile width
const TH = 32; // tile height

interface Props {
  building: Building;
  offsetX: number;
  offsetY: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function toIso(col: number, row: number, ox: number, oy: number) {
  return {
    x: ox + (col - row) * (TW / 2),
    y: oy + (col + row) * (TH / 2),
  };
}

export const IsometricBuilding: React.FC<Props> = ({
  building, offsetX, offsetY, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave,
}) => {
  const { pos, color, accentColor, height: bh, name, icon } = building;
  const { x: cx, y: cy } = toIso(pos.col, pos.row, offsetX, offsetY);

  // Tile center is the center of the diamond; building sits on top
  const topCY = cy - bh;

  // Top face diamond points
  const topFace = [
    `${cx},${topCY - TH / 2}`,            // top
    `${cx + TW / 2},${topCY}`,             // right
    `${cx},${topCY + TH / 2}`,             // bottom
    `${cx - TW / 2},${topCY}`,             // left
  ].join(' ');

  // Left face
  const leftFace = [
    `${cx - TW / 2},${topCY}`,
    `${cx},${topCY + TH / 2}`,
    `${cx},${cy + TH / 2}`,
    `${cx - TW / 2},${cy}`,
  ].join(' ');

  // Right face
  const rightFace = [
    `${cx},${topCY + TH / 2}`,
    `${cx + TW / 2},${topCY}`,
    `${cx + TW / 2},${cy}`,
    `${cx},${cy + TH / 2}`,
  ].join(' ');

  const glowOpacity = isSelected ? 0.9 : isHovered ? 0.6 : 0;
  const glowFilter = isSelected
    ? `drop-shadow(0 0 10px ${accentColor}) drop-shadow(0 0 20px ${accentColor})`
    : isHovered
    ? `drop-shadow(0 0 6px ${accentColor})`
    : 'none';

  // Derive face colors from base color
  const topLight = accentColor + '22';
  const leftColor = color;
  const rightColor = color + 'cc';

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer', filter: glowFilter, transition: 'filter 0.2s' }}
    >
      {/* Right face */}
      <polygon points={rightFace} fill={rightColor} stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.4" />
      {/* Left face */}
      <polygon points={leftFace} fill={leftColor} stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.4" />
      {/* Top face */}
      <polygon points={topFace} fill={topLight} stroke={accentColor} strokeWidth="1" />

      {/* Accent top border glow */}
      {(isSelected || isHovered) && (
        <polygon points={topFace} fill="none" stroke={accentColor} strokeWidth="1.5" opacity={glowOpacity} />
      )}

      {/* Building icon */}
      <text
        x={cx}
        y={topCY - 2}
        textAnchor="middle"
        fontSize="16"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {icon}
      </text>

      {/* Building name label */}
      <text
        x={cx}
        y={topCY - 22}
        textAnchor="middle"
        fontSize="7"
        fontFamily="'Share Tech Mono', monospace"
        fill={accentColor}
        opacity={isSelected || isHovered ? 1 : 0.6}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {name.toUpperCase()}
      </text>

      {/* Selection pulse ring */}
      {isSelected && (
        <ellipse
          cx={cx}
          cy={cy + TH / 2 - 4}
          rx={TW / 2 + 6}
          ry={TH / 4 + 3}
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
          opacity="0.5"
          style={{ animation: 'pulse-ring 1.5s ease-in-out infinite' }}
        />
      )}
    </g>
  );
};
