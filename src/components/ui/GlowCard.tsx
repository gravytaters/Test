import React from 'react';

interface Props {
  children: React.ReactNode;
  accent?: string;
  className?: string;
  onClick?: () => void;
}

export const GlowCard: React.FC<Props> = ({ children, accent = '#00ff88', className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-lg relative overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
    style={{
      background: 'rgba(10,16,32,0.8)',
      border: `1px solid ${accent}33`,
      boxShadow: `0 0 12px ${accent}11, inset 0 0 20px rgba(0,0,0,0.3)`,
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}
    onMouseEnter={e => {
      if (!onClick) return;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${accent}33, inset 0 0 20px rgba(0,0,0,0.3)`;
      (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}66`;
    }}
    onMouseLeave={e => {
      if (!onClick) return;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${accent}11, inset 0 0 20px rgba(0,0,0,0.3)`;
      (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}33`;
    }}
  >
    {/* Scan line overlay */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
      }}
    />
    {children}
  </div>
);
