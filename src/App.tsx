/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sliders, HelpCircle, HardDrive, ShieldAlert, KeyRound, ArrowRight, Music4, Info } from "lucide-react";
import { DashboardHeader } from "./components/DashboardHeader";
import { Step1StemSeparation } from "./components/Step1StemSeparation";
import { Step2TargetVoice } from "./components/Step2TargetVoice";
import { Step3VoiceClone } from "./components/Step3VoiceClone";
import { Step4StudioMixer } from "./components/Step4StudioMixer";
import { SunoTrack, TargetVoice } from "./types";

export default function App() {
  const [replicateConfigured, setReplicateConfigured] = useState<boolean>(false);
  const [replicateKeyHint, setReplicateKeyHint] = useState<string | null>(null);

  // Workflow states
  const [sunoTrack, setSunoTrack] = useState<SunoTrack | null>(null);
  const [vocalsStemUrl, setVocalsStemUrl] = useState<string | undefined>(undefined);
  const [vocalsStemName, setVocalsStemName] = useState<string>("");
  const [instrumentalStemUrl, setInstrumentalStemUrl] = useState<string | undefined>(undefined);
  const [instrumentalStemName, setInstrumentalStemName] = useState<string>("");

  const [targetVoice, setTargetVoice] = useState<TargetVoice | null>(null);
  const [clonedVocalsUrl, setClonedVocalsUrl] = useState<string | null>(null);

  // Fetch API configuration status on load
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setReplicateConfigured(data.replicateConfigured);
        setReplicateKeyHint(data.replicateKeyHint);
      })
      .catch((err) => console.error("Config check failed:", err));
  }, []);

  // Stem separation outcome callbacks
  const handleStemsGenerated = (
    vocalsUrl: string,
    vocalsName: string,
    instrumentalUrl: string,
    instrumentalName: string
  ) => {
    setVocalsStemUrl(vocalsUrl);
    setVocalsStemName(vocalsName);
    setInstrumentalStemUrl(instrumentalUrl);
    setInstrumentalStemName(instrumentalName);

    // Update track with stem information
    if (sunoTrack) {
      setSunoTrack((prev) =>
        prev
          ? {
              ...prev,
              vocalsUrl,
              instrumentalUrl,
            }
          : null
      );
    }
  };

  const handleTrackUploaded = (track: SunoTrack) => {
    setSunoTrack(track);
    // Clearing stems if they upload a new original track
    if (!track) {
      setVocalsStemUrl(undefined);
      setInstrumentalStemUrl(undefined);
      setClonedVocalsUrl(null);
    }
  };

  const handleVoiceUploaded = (voice: TargetVoice) => {
    setTargetVoice(voice);
    if (!voice) {
      setClonedVocalsUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 4-STEP AUDIO PIPELINE HEADER */}
      <DashboardHeader
        replicateConfigured={replicateConfigured}
        replicateKeyHint={replicateKeyHint}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
        
        {/* PIPELINE OVERVIEW INFOBAR */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
              <Music4 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Interactive Production Console</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Convert or blend vocals on any audio track. Follow the 4-step wizard panel below to isolate stems, analyze target voice footprints, run neural conversions, and mix inside our producer desk.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800 self-stretch md:self-auto justify-center">
            <Info className="h-4 w-4 text-emerald-400" />
            <span>Workflow Nodes: Fully Powered</span>
          </div>
        </div>

        {/* WORKSPACE DIVISION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: GUIDED STEP ROADMAP CARD */}
          <div className="lg:col-span-4 bg-[#121214] border border-zinc-800 rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
            <h3 className="font-display font-bold text-white text-sm tracking-tight flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-emerald-400" /> Pipeline Progress Map
            </h3>

            <div className="space-y-3 pt-2">
              
              {/* STEP 1 MAP */}
              <a href="#step-1" className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                sunoTrack ? "bg-emerald-950/10 border-emerald-500/20 text-white" : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                  sunoTrack ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 border border-zinc-800"
                }`}>
                  01
                </span>
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold">Stem Separation</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {sunoTrack ? `Verified (${(sunoTrack.size / (1024 * 1024)).toFixed(1)} MB)` : "Upload Suno Track"}
                  </p>
                </div>
              </a>

              {/* STEP 2 MAP */}
              <a href="#step-2" className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                targetVoice ? "bg-emerald-950/10 border-emerald-500/20 text-white" : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                  targetVoice ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 border border-zinc-800"
                }`}>
                  02
                </span>
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold">Voice Blueprint</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {targetVoice ? `Loaded (${(targetVoice.size / 1024).toFixed(1)} KB)` : "Upload target sample"}
                  </p>
                </div>
              </a>

              {/* STEP 3 MAP */}
              <a href="#step-3" className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                clonedVocalsUrl ? "bg-emerald-950/10 border-emerald-500/20 text-white" : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                  clonedVocalsUrl ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 border border-zinc-800"
                }`}>
                  03
                </span>
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold">Voice Swap Output</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {clonedVocalsUrl ? "Vocal render complete" : "Awaiting pre-conditions"}
                  </p>
                </div>
              </a>

              {/* STEP 4 MAP */}
              <a href="#step-4" className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                clonedVocalsUrl && instrumentalStemUrl ? "bg-emerald-950/10 border-emerald-500/20 text-white" : "bg-zinc-950/20 border-zinc-900/60 text-zinc-650"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                  clonedVocalsUrl && instrumentalStemUrl ? "bg-teal-500 text-zinc-950" : "bg-zinc-950 border border-zinc-900"
                }`}>
                  04
                </span>
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold">Studio Mixer board</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {clonedVocalsUrl && instrumentalStemUrl ? "Console unlocked" : "Complete conversion first"}
                  </p>
                </div>
              </a>

            </div>

            <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-900">
              <span className="font-semibold text-zinc-400">Environment Checklist:</span>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Local Sandboxing supports instant mock synthesis</li>
                <li>Vite Dynamic asset router and Node 20+ engine fully synced</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: THE STEP ENGINE STACK */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* STEP 1: STEM SEPARATION */}
            <Step1StemSeparation
              onStemsGenerated={handleStemsGenerated}
              onTrackUploaded={handleTrackUploaded}
              track={sunoTrack}
              replicateConfigured={replicateConfigured}
            />

            {/* STEP 2: TARGET VOICE REFERENCE */}
            <Step2TargetVoice
              onVoiceUploaded={handleVoiceUploaded}
              voice={targetVoice}
            />

            {/* STEP 3: VOICE CLONE RENDERING (RVC) */}
            <Step3VoiceClone
              vocalsUrl={vocalsStemUrl}
              vocalsName={vocalsStemName}
              voiceUrl={targetVoice?.url}
              voiceName={targetVoice?.name || "Vocal_Sample.mp3"}
              onCloneGenerated={(url) => setClonedVocalsUrl(url)}
              clonedUrl={clonedVocalsUrl}
              replicateConfigured={replicateConfigured}
            />

            {/* STEP 4: DAW MULTITRACK MIXER */}
            <Step4StudioMixer
              instrumentalUrl={instrumentalStemUrl}
              clonedVocalUrl={clonedVocalsUrl || undefined}
            />

          </div>

        </div>

      </main>

      <footer className="mt-20 border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 font-sans">
        <p>© 2026 Suno Voice Swapper Studio. All Rights Reserved.</p>
        <p className="mt-1">Crafted for next-generation musicians and voice synthesis engineers.</p>
      </footer>
    </div>
  );
}
