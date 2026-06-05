import React from 'react';
import { motion } from 'framer-motion';
import type { TokenUsage } from '../../types';
import { GlowCard } from '../ui/GlowCard';

interface Props { tokenUsage: TokenUsage[] }

export const TokenBankPanel: React.FC<Props> = ({ tokenUsage }) => {
  const totalInput = tokenUsage.reduce((s, t) => s + t.inputTokens, 0);
  const totalOutput = tokenUsage.reduce((s, t) => s + t.outputTokens, 0);
  const totalCost = tokenUsage.reduce((s, t) => s + t.cost, 0);
  const maxTokens = Math.max(...tokenUsage.map(t => t.inputTokens + t.outputTokens));

  return (
    <div className="flex flex-col gap-3">
      {/* Totals */}
      <div className="grid grid-cols-3 gap-2">
        <GlowCard accent="#ffdd00" className="p-3 text-center">
          <p style={{ fontSize: 14, color: '#ffdd00', fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
            {(totalInput + totalOutput).toLocaleString()}
          </p>
          <p style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>TOTAL TOKENS</p>
        </GlowCard>
        <GlowCard accent="#00aaff" className="p-3 text-center">
          <p style={{ fontSize: 14, color: '#00aaff', fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
            {totalInput.toLocaleString()}
          </p>
          <p style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>INPUT</p>
        </GlowCard>
        <GlowCard accent="#aa55ff" className="p-3 text-center">
          <p style={{ fontSize: 14, color: '#aa55ff', fontFamily: 'Share Tech Mono', fontWeight: 700 }}>
            ${totalCost.toFixed(2)}
          </p>
          <p style={{ fontSize: 7, color: '#4a6a8a', marginTop: 2 }}>EST. COST</p>
        </GlowCard>
      </div>

      {/* Per-agent bars */}
      {tokenUsage.map(t => {
        const total = t.inputTokens + t.outputTokens;
        const pct = (total / maxTokens) * 100;
        const inputPct = (t.inputTokens / total) * 100;
        return (
          <GlowCard key={t.agent} accent="#ffdd00" className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span style={{ fontSize: 10, color: '#ffdd00', fontFamily: 'Share Tech Mono' }}>{t.agent}</span>
                <span style={{ fontSize: 7, color: '#4a6a8a', marginLeft: 8 }}>{t.model}</span>
              </div>
              <span style={{ fontSize: 9, color: '#aa55ff' }}>${t.cost.toFixed(2)}</span>
            </div>

            {/* Stacked bar: input (blue) + output (purple) */}
            <div style={{ background: '#1a2744', borderRadius: 4, height: 8, overflow: 'hidden', display: 'flex' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(inputPct / 100) * pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: '#00aaff', boxShadow: '0 0 6px #00aaff' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((100 - inputPct) / 100) * pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                style={{ height: '100%', background: '#aa55ff', boxShadow: '0 0 6px #aa55ff' }}
              />
            </div>

            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 7, color: '#00aaff' }}>IN {t.inputTokens.toLocaleString()}</span>
              <span style={{ fontSize: 7, color: '#aa55ff' }}>OUT {t.outputTokens.toLocaleString()}</span>
            </div>
          </GlowCard>
        );
      })}

      {/* Note where real data hooks in */}
      <p style={{ fontSize: 7, color: '#2a4a6a', fontFamily: 'Share Tech Mono', textAlign: 'center' }}>
        {/* Connect to billing API: GET /v1/usage/tokens?since=today */}
        DEMO DATA — CONNECT TO BILLING API FOR LIVE COSTS
      </p>
    </div>
  );
};
