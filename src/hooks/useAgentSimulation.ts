import { useState, useEffect } from 'react';
import type { Agent, GridPos } from '../types';
import { agents as initialAgents, GRID_COLS, GRID_ROWS } from '../data/mockData';

// Simulation hook — in production this would consume a WebSocket feed
// e.g. const ws = new WebSocket('wss://your-agent-orchestrator/events')
// ws.onmessage = (e) => setAgents(prev => updateAgent(prev, JSON.parse(e.data)))

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomNeighbour(pos: GridPos): GridPos {
  const dirs = [
    { col: 1, row: 0 }, { col: -1, row: 0 },
    { col: 0, row: 1 }, { col: 0, row: -1 },
    { col: 1, row: 1 }, { col: -1, row: -1 },
  ];
  const d = dirs[Math.floor(Math.random() * dirs.length)];
  return {
    col: clamp(pos.col + d.col, 1, GRID_COLS - 2),
    row: clamp(pos.row + d.row, 1, GRID_ROWS - 2),
  };
}

export function useAgentSimulation() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    // Animate agents toward their target, then pick a new target
    const posInterval = setInterval(() => {
      setAgents(prev =>
        prev.map(agent => {
          if (agent.status === 'sleeping' || agent.status === 'error') return agent;

          const { pos, targetPos } = agent;
          const arrived =
            Math.abs(pos.col - targetPos.col) < 0.15 &&
            Math.abs(pos.row - targetPos.row) < 0.15;

          if (arrived) {
            return { ...agent, pos: targetPos, targetPos: randomNeighbour(targetPos) };
          }

          const speed = agent.status === 'active' ? 0.04 : 0.02;
          return {
            ...agent,
            pos: {
              col: pos.col + (targetPos.col - pos.col) * speed,
              row: pos.row + (targetPos.row - pos.row) * speed,
            },
          };
        })
      );
    }, 50);

    // Occasionally cycle agent statuses to simulate live activity
    const statusInterval = setInterval(() => {
      setAgents(prev =>
        prev.map(agent => {
          if (Math.random() < 0.15 && agent.status !== 'error' && agent.status !== 'sleeping') {
            const cycle: Agent['status'][] = ['active', 'thinking', 'idle'];
            const next = cycle[Math.floor(Math.random() * cycle.length)];
            return { ...agent, status: next };
          }
          return agent;
        })
      );
    }, 4000);

    return () => {
      clearInterval(posInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return agents;
}
