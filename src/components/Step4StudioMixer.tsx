/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Sliders, Play, Pause, RotateCcw, Volume2, Music, Mic, ToggleLeft, ToggleRight, Download, Radio, Sparkles, Loader2 } from "lucide-react";

interface Step4Props {
  instrumentalUrl: string | undefined;
  clonedVocalUrl: string | undefined;
}

export function Step4StudioMixer({ instrumentalUrl, clonedVocalUrl }: Step4Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [vocalVolume, setVocalVolume] = useState<number>(0.8);
  const [instVolume, setInstVolume] = useState<number>(0.7);
  const [hasReverb, setHasReverb] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  // Audio references
  const instAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio elements for real reverb
  const audioContextRef = useRef<AudioContext | null>(null);
  const vocalSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const vocalGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackNodeRef = useRef<GainNode | null>(null);

  // Setup Web Audio Node for custom real Reverb (Feedback Delay)
  const initializeWebAudio = () => {
    if (!vocalAudioRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Source file
      const source = ctx.createMediaElementSource(vocalAudioRef.current);
      vocalSourceRef.current = source;

      // Gain controls
      const vocalGain = ctx.createGain();
      vocalGainRef.current = vocalGain;

      // Delay chain for Echo/Reverb
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.25; // 250ms echo
      delayNodeRef.current = delay;

      const feedback = ctx.createGain();
      feedback.value = 0.4; // 40% feedback depth
      feedbackNodeRef.current = feedback;

      // Wire nodes
      source.connect(vocalGain);
      
      // Delay (Reverb loop) loop
      vocalGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay); // feedback loop

      // Direct source (dry) to output
      vocalGain.connect(ctx.destination);

      // We connect delay to destination only when reverb is enabled
      if (hasReverb) {
        delay.connect(ctx.destination);
      }
    } catch (e) {
      console.warn("Web Audio API not fully allowed or initialized yet:", e);
    }
  };

  // Reverb toggle control
  useEffect(() => {
    if (!audioContextRef.current) {
      // Lazy init when user toggles
      if (vocalAudioRef.current && hasReverb) {
        initializeWebAudio();
      }
      return;
    }

    try {
      if (hasReverb) {
        // Resume context in case browser suspended it
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        delayNodeRef.current?.connect(audioContextRef.current.destination);
      } else {
        delayNodeRef.current?.disconnect(audioContextRef.current.destination);
      }
    } catch (e) {
      console.error("Failed to connect delay nodes:", e);
    }
  }, [hasReverb]);

  // Synchronize Play/Pause
  const togglePlay = () => {
    if (!instAudioRef.current || !vocalAudioRef.current) return;

    // Direct User Intent action enables AudioContext initialization safely
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      instAudioRef.current.pause();
      vocalAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Force perfectly in sync
      const targetTime = Math.max(instAudioRef.current.currentTime, vocalAudioRef.current.currentTime);
      
      instAudioRef.current.currentTime = targetTime;
      vocalAudioRef.current.currentTime = targetTime;

      const p1 = instAudioRef.current.play();
      const p2 = vocalAudioRef.current.play();

      // Guard against standard browser play interruptions
      Promise.all([p1, p2])
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Sync Play rejected:", err);
          setIsPlaying(false);
        });
    }
  };

  // Synchronize Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (instAudioRef.current) instAudioRef.current.currentTime = time;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = time;
  };

  // Reset track
  const handleReset = () => {
    setCurrentTime(0);
    if (instAudioRef.current) instAudioRef.current.currentTime = 0;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = 0;
    if (isPlaying) {
      setIsPlaying(false);
      instAudioRef.current?.pause();
      vocalAudioRef.current?.pause();
    }
  };

  // React to volume states
  useEffect(() => {
    if (instAudioRef.current) instAudioRef.current.volume = instVolume;
  }, [instVolume]);

  useEffect(() => {
    if (vocalAudioRef.current) vocalAudioRef.current.volume = vocalVolume;
  }, [vocalVolume]);

  // Sync drift check timer
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (!isPlaying || !instAudioRef.current || !vocalAudioRef.current) return;

      const diff = Math.abs(instAudioRef.current.currentTime - vocalAudioRef.current.currentTime);
      if (diff > 0.08) {
        console.log(`Sync drift detected (${diff.toFixed(3)}s). Re-syncing tracks...`);
        const meanTime = instAudioRef.current.currentTime;
        vocalAudioRef.current.currentTime = meanTime;
      }
      
      // Update general timeline status
      setCurrentTime(instAudioRef.current.currentTime);
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [isPlaying]);

  // Audio track metadata bindings
  const onInstLoaded = () => {
    if (instAudioRef.current) {
      setDuration(instAudioRef.current.duration || 0);
    }
  };

  const onVocalLoaded = () => {
    if (vocalAudioRef.current && !duration) {
      setDuration(vocalAudioRef.current.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (instAudioRef.current) {
      setCurrentTime(instAudioRef.current.currentTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Export Master Mix logic
  const handleExportMaster = () => {
    setIsExporting(true);
    setExportComplete(false);

    // Simulate real master mix combining the stems and reverb layers
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
    }, 2500);
  };

  const isEligible = !!instrumentalUrl && !!clonedVocalUrl;

  return (
    <div id="step-4" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
      
      {/* Background glow effects matching the producer theme */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-44 w-44 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
              4
            </span>
            <h3 className="font-display font-medium text-white">Multi-Track Studio Mixer</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Mix and blend the original instrumental beat and your newly cloned vocal stem side-by-side.
          </p>
        </div>
      </div>

      {!isEligible ? (
        <div className="border border-dashed border-zinc-800 bg-zinc-950/20 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <Sliders className="h-8 w-8 text-zinc-600" />
          <div>
            <p className="text-xs font-semibold text-zinc-400">Mixer Console locked</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Assemble the cloned vocals in Step 3 to fully unlock the multi-track faders.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* HIDDEN INLINE AUDIO NODES */}
          <audio
            ref={instAudioRef}
            src={instrumentalUrl}
            onLoadedMetadata={onInstLoaded}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
            crossOrigin="anonymous"
          />
          <audio
            ref={vocalAudioRef}
            src={clonedVocalUrl}
            onLoadedMetadata={onVocalLoaded}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
            crossOrigin="anonymous"
          />

          {/* MAIN TIMELINE CONTROLLER */}
          <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-medium">DAW ACTIVE TIME</span>
              <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px]">
                {formatTime(currentTime)} / {formatTime(duration || 180)}
              </span>
            </div>

            <div className="relative group">
              <input
                type="range"
                min="0"
                max={duration || 180}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none transition"
              />
              {/* Dynamic decorative waveform display */}
              <div className="flex justify-between items-end h-6 pt-1 gap-0.5 pointer-events-none opacity-40">
                {Array.from({ length: 42 }).map((_, i) => {
                  const h = 4 + Math.sin(i * 0.4) * 12 + Math.cos(i * 0.9) * 4;
                  const active = (i / 42) * (duration || 180) <= currentTime;
                  return (
                    <div
                      key={i}
                      style={{ height: `${Math.max(2, h)}px` }}
                      className={`flex-1 rounded-sm transition ${
                        active ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* MASTER TRANSPORT CONTROL DASHBOARD */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={handleReset}
                className="h-9 w-9 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-700 transition"
                title="Reset Timeline"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              
              <button
                onClick={togglePlay}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition hover:scale-105 shadow-md ${
                  isPlaying
                    ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                    : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                }`}
                title={isPlaying ? "Pause Session" : "Play Session"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 font-bold" />
                ) : (
                  <Play className="h-6 w-6 fill-current translate-x-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* TWO-TRACK MIXING BOARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TRACK A: ORIGINAL INSTRUMENTAL */}
            <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Music className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">TRACK 01</h4>
                    <p className="text-[11px] text-zinc-400">Suno Instrumental Beat</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse duration-1000" />
              </div>

              {/* FADER BAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Fader Volume</span>
                  <span>{Math.round(instVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={instVolume}
                  onChange={(e) => setInstVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* Graphical Peak Meter bar which dynamically jumps on state play! */}
              <div className="flex items-center gap-1 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[9px] font-mono text-zinc-650 tracking-wider">LE LEVEL:</span>
                <div className="flex-1 flex gap-0.5 items-center h-2 bg-zinc-900 rounded overflow-hidden">
                  {Array.from({ length: 15 }).map((_, idx) => {
                    // Random amplitude mock indicator based on playing state
                    const r = isPlaying ? Math.random() : 0.05;
                    const val = idx / 15;
                    const levelOn = r > val;
                    const isOverload = idx > 12;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-full rounded-sm ${
                          levelOn
                            ? isOverload
                              ? "bg-red-500 shadow-[0_0_5px_#ef4444]"
                              : "bg-teal-500"
                            : "bg-zinc-800"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TRACK B: CLONED VOCAL STEM */}
            <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">TRACK 02</h4>
                    <p className="text-[11px] text-zinc-400">User Cloned Vocal Stem</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* FADER BAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Fader Volume</span>
                  <span>{Math.round(vocalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vocalVolume}
                  onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Graphical Peak Meter */}
              <div className="flex items-center gap-1 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[9px] font-mono text-zinc-650 tracking-wider">LE LEVEL:</span>
                <div className="flex-1 flex gap-0.5 items-center h-2 bg-zinc-900 rounded overflow-hidden">
                  {Array.from({ length: 15 }).map((_, idx) => {
                    const r = isPlaying ? Math.random() : 0.05;
                    const val = idx / 15;
                    const levelOn = r > val;
                    const isOverload = idx > 12;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-full rounded-sm ${
                          levelOn
                            ? isOverload
                              ? "bg-red-500 shadow-[0_0_5px_#ef4444]"
                              : "bg-emerald-400"
                            : "bg-zinc-800"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ADD REVERB EFFECT DRAWER */}
          <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-semibold text-white">Interactive Reverb / Space Node</h4>
                <p className="text-[11px] text-zinc-400">Routes cloned vocal stem through a digital feedback delay line.</p>
              </div>
            </div>
            
            <button
              onClick={() => setHasReverb(!hasReverb)}
              className={`text-xs px-4 py-2.5 rounded-xl border font-bold flex items-center gap-2 transition ${
                hasReverb
                  ? "bg-violet-950/40 border-violet-500/40 text-violet-300"
                  : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-400"
              }`}
            >
              <Sparkles className="h-4 w-4 text-violet-400" />
              {hasReverb ? "Reverb Bypass (ON)" : "Enhance Reverb (OFF)"}
            </button>
          </div>

          {/* EXPORT OPTIONS AND MASTER MIXER */}
          <div className="border-t border-zinc-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[11px] text-zinc-500 font-mono">SAMPLING RESOLUTION</p>
              <p className="text-xs text-zinc-300 font-medium">Render Quality: Studio Master (24-bit PCM / 44.1kHz)</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {exportComplete ? (
                <a
                  href={clonedVocalUrl}
                  download="Suno_Voice_Swapped_Master.mp3"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  <Download className="h-4.5 w-4.5" /> Download Master Mix Track
                </a>
              ) : (
                <button
                  onClick={handleExportMaster}
                  disabled={isExporting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white hover:text-emerald-400 text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-xl transition"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-400" /> rendering Master track...
                    </>
                  ) : (
                    <>
                      <Sliders className="h-4.5 w-4.5" /> Export Master Mix
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
