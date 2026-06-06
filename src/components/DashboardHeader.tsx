/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sliders, HelpCircle, HardDrive, Cpu, ShieldAlert, BadgeCheck } from "lucide-react";

interface DashboardHeaderProps {
  replicateConfigured: boolean;
  replicateKeyHint: string | null;
}

export function DashboardHeader({ replicateConfigured, replicateKeyHint }: DashboardHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-[#121214]/90 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Sliders className="h-5 w-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Suno Voice Swapper <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">STUDIO</span>
            </h1>
            <p className="text-xs text-zinc-400 font-sans">
              4-Step AI Vocal Conversion & Multi-Track Mixing Pipeline
            </p>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="flex items-center gap-3">
          {replicateConfigured ? (
            <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
              <BadgeCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                  Replicate Cloud Connected
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Token: {replicateKeyHint}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-950/40 border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-mono font-semibold text-amber-500">
                  Demo Sandbox Mode active
                </p>
                <p className="text-[10px] text-zinc-400 font-sans">
                  Configure REPLICATE_API_TOKEN to run real models
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
