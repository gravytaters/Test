import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TownMap } from './components/town/TownMap';
import { AgentDetailPanel } from './components/panels/AgentDetailPanel';
import { BuildingPanel } from './components/panels/BuildingPanel';
import { TopBar } from './components/ui/TopBar';
import { useAgentSimulation } from './hooks/useAgentSimulation';
import {
  buildings, tasks, logs, tools, memories,
  tokenUsage, messages, scheduledJobs,
} from './data/mockData';
import type { SelectionType, BuildingType } from './types';

export default function App() {
  const agents = useAgentSimulation();
  const [selection, setSelection] = useState<SelectionType>(null);

  const selectedAgent = selection?.kind === 'agent'
    ? agents.find(a => a.id === selection.id) ?? null
    : null;

  const selectedBuilding = selection?.kind === 'building'
    ? buildings.find(b => b.id === selection.id) ?? null
    : null;

  function handleSelectAgent(id: string) {
    setSelection(prev => prev?.kind === 'agent' && prev.id === id ? null : { kind: 'agent', id });
  }

  function handleSelectBuilding(id: BuildingType) {
    setSelection(prev => prev?.kind === 'building' && prev.id === id ? null : { kind: 'building', id });
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', width: '100vw', background: '#080b14', overflow: 'hidden' }}
    >
      <TopBar agents={agents} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main map area */}
        <div
          className="flex-1 overflow-auto"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, #0c1428 0%, #080b14 70%)',
          }}
        >
          <TownMap
            agents={agents}
            buildings={buildings}
            selection={selection}
            onSelectAgent={handleSelectAgent}
            onSelectBuilding={handleSelectBuilding}
          />
        </div>

        {/* Side panel (slides in from right) */}
        <AnimatePresence mode="wait">
          {selectedAgent && (
            <AgentDetailPanel
              key={`agent-${selectedAgent.id}`}
              agent={selectedAgent}
              onClose={() => setSelection(null)}
            />
          )}
          {selectedBuilding && (
            <BuildingPanel
              key={`building-${selectedBuilding.id}`}
              building={selectedBuilding}
              onClose={() => setSelection(null)}
              tasks={tasks}
              logs={logs}
              tools={tools}
              memories={memories}
              tokenUsage={tokenUsage}
              messages={messages}
              jobs={scheduledJobs}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom hint bar */}
      <div
        className="flex items-center justify-center gap-8 shrink-0"
        style={{
          height: 28,
          borderTop: '1px solid #1e3a5a',
          background: 'rgba(8,11,20,0.9)',
          fontFamily: 'Share Tech Mono',
          fontSize: 8,
          color: '#2a4a6a',
        }}
      >
        <span>CLICK AGENT to inspect</span>
        <span style={{ color: '#1e3a5a' }}>·</span>
        <span>CLICK BUILDING to open dashboard</span>
        <span style={{ color: '#1e3a5a' }}>·</span>
        <span>SCROLL to pan map</span>
        <span style={{ color: '#1e3a5a' }}>·</span>
        <span style={{ color: '#1e3050' }}>DEMO MODE</span>
      </div>
    </div>
  );
}
