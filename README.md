# AgentTown — AI Operations Dashboard

A retro isometric pixel-art town where AI agents come to life. Monitor agents, tasks, logs, memory, tokens, messages, and scheduled jobs — all from a single cozy cyberpunk dashboard.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What You're Looking At

The map is a live isometric town. Each coloured sprite is an AI agent moving between buildings. Click anything to open a detail panel on the right.

**Agents** (the walking sprites):
- ARIA — active, processing feedback batches
- NEXUS — thinking, designing architecture
- PIXEL — idle, waiting for assets
- VEGA — active, indexing the codebase
- CRONOS — sleeping, scheduled nightly runner
- ECHO — error state, Slack API rate-limited

**Buildings** (click each one):
| Building | Contents |
|---|---|
| ⚡ Task Hall | Running, queued, and failed tasks with progress bars |
| 📚 Logs Library | Filterable structured event log |
| 🔧 Tool Workshop | Tool registry with health, latency, and call counts |
| 🧠 Memory Archive | Episodic, semantic, and working memory stores |
| 💰 Token Bank | Per-agent token consumption and cost breakdown |
| 📡 Message Tower | Agent-to-agent and human-to-agent message feed |
| 🕰️ Scheduler Clocktower | Cron jobs and next-run scheduling |

## Connecting Real Data

The codebase is wired with comments at every integration point:

- **Agent states** — `src/hooks/useAgentSimulation.ts` · replace the simulation loop with a WebSocket consumer: `new WebSocket('wss://your-orchestrator/events')`
- **Task list** — `src/data/mockData.ts` · replace `tasks` array with a fetch to your task API
- **Logs** — replace `logs` array with a streaming log endpoint or polling
- **Token usage** — replace `tokenUsage` with a call to your billing API
- **Messages** — subscribe to your agent message bus in `MessageTowerPanel.tsx`
- **Scheduler** — fetch scheduled jobs from your cron/workflow service

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Map | SVG isometric rendering (pure CSS/SVG, no canvas) |
| Data | Local mock data (ready for API swap) |
| Fonts | Press Start 2P (titles), Share Tech Mono (UI) |

## Project Structure

```
src/
  types/index.ts           — All TypeScript interfaces
  data/mockData.ts         — Mock agents, buildings, tasks, logs, etc.
  hooks/useAgentSimulation.ts  — Agent movement + status simulation
  components/
    town/
      TownMap.tsx          — SVG isometric map, tile grid, z-sorting
      IsometricBuilding.tsx — 3-faced isometric box + glow effects
      AgentSprite.tsx      — Pixel-art agent sprites with walk animation
    panels/
      AgentDetailPanel.tsx — Agent inspector (status, task, tokens, tools)
      BuildingPanel.tsx    — Building panel shell + router
      TaskHallPanel.tsx    — Task list with progress bars
      LogsLibraryPanel.tsx — Filterable log viewer
      ToolWorkshopPanel.tsx — Tool registry and health
      MemoryArchivePanel.tsx — Memory store browser
      TokenBankPanel.tsx   — Token usage charts
      MessageTowerPanel.tsx — Message feed
      SchedulerPanel.tsx   — Cron job list
    ui/
      TopBar.tsx           — Header with live stats
      StatusBadge.tsx      — Agent status indicator
      GlowCard.tsx         — Reusable glow-border card
```

## Design Notes

- Dark mode only — `#080b14` base with neon accent glows
- Isometric projection: `screenX = (col - row) × 32`, `screenY = (col + row) × 16`
- Buildings render back-to-front by `col + row` depth sort
- Agent sprites use SVG rects for pixel-art feel with CSS keyframe walk bounce
- All panels slide in from the right using Framer Motion spring animations
- Scanline overlay and glow effects are pure CSS
