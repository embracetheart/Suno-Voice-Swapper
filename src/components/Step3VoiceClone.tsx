/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Cpu, Loader2, Sparkles, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { SunoTrack, TargetVoice, StepState } from "../types";

interface Step3Props {
  vocalsUrl: string | undefined;
  vocalsName: string;
  voiceUrl: string | undefined;
  voiceName: string;
  onCloneGenerated: (clonedUrl: string) => void;
  clonedUrl: string | null;
  replicateConfigured: boolean;
}

export function Step3VoiceClone({
  vocalsUrl,
  vocalsName,
  voiceUrl,
  voiceName,
  onCloneGenerated,
  clonedUrl,
  replicateConfigured,
}: Step3Props) {
  const [cloneState, setCloneState] = useState<StepState>("idle");
  const [cloneWarning, setCloneWarning] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const executeVoiceSwap = async () => {
    if (!vocalsUrl || !voiceUrl) return;

    setCloneState("processing");
    setProgressMessage("Starting RVC vocal cloning nodes...");

    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocalsUrl,
          vocalsName,
          voiceSampleUrl: voiceUrl,
          voiceSampleName: voiceName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "RVC voice cloning backend error");
      }

      const initiateResult = await res.json();

      if (initiateResult.status === "succeeded") {
        // Mock Sandbox Mode
        setCloneState("success");
        if (initiateResult.warning) {
          setCloneWarning(initiateResult.warning);
        } else {
          setCloneWarning(null);
        }
        onCloneGenerated(initiateResult.clonedVocalsUrl);
      } else {
        setCloneWarning(null);
        // Real Mode - Poll Replicate prediction
        const predictionId = initiateResult.id;
        setProgressMessage("Voice swapping job in progress. RVC model matching harmonics (this takes ~30-90s)...");
        pollPrediction(predictionId);
      }
    } catch (err: any) {
      console.error(err);
      setCloneState("error");
      setProgressMessage(err.message || "An error occurred during voice cloning process.");
    }
  };

  // Poll prediction status
  const pollPrediction = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/prediction/${id}`);
        if (!res.ok) throw new Error("Could not fetch cloning prediction progress");

        const data = await res.json();
        const status = data.status;

        if (status === "succeeded") {
          clearInterval(interval);
          setCloneState("success");
          if (data.warning) {
            setCloneWarning(data.warning);
          } else {
            setCloneWarning(null);
          }
          
          let resultUrl = data.output;
          // output can be array or string
          if (Array.isArray(resultUrl)) {
            resultUrl = resultUrl[0];
          }

          if (!resultUrl) {
            throw new Error("RVC finished but no vocal audio URL was produced.");
          }

          onCloneGenerated(resultUrl);
        } else if (status === "failed") {
          clearInterval(interval);
          setCloneState("error");
          setProgressMessage(data.error || "Replicate RVC conversion prediction failed");
        } else {
          // Update details
          setProgressMessage(`RVC Harmony Engine: Status is '${status}'...`);
        }
      } catch (err: any) {
        clearInterval(interval);
        setCloneState("error");
        setProgressMessage(err.message || "Cloning tracking error");
      }
    }, 4500);
  };

  const isEligible = !!vocalsUrl && !!voiceUrl;

  return (
    <div id="step-3" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
              3
            </span>
            <h3 className="font-display font-medium text-white">Execute Voice Swap</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Converts isolated Suno melody vocal tracks into the target vocal characteristics using a neural RVC model.
          </p>
        </div>
        {clonedUrl && (
          <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" /> HARMONIC RENDERED
          </span>
        )}
      </div>

      {!isEligible ? (
        <div className="bg-zinc-950/40 rounded-xl p-6 border border-zinc-800/60 text-center flex flex-col items-center gap-2.5">
          <AlertTriangle className="h-7 w-7 text-zinc-500" />
          <div>
            <p className="text-xs font-semibold text-zinc-400">Pipeline in queue</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Complete Step 1 (Isolate Suno Vocals) and Step 2 (Upload Target Voice Reference) to activate the RVC Swapping Console.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const isLocalFallback = (vocalsUrl && vocalsUrl.startsWith("blob:")) || (voiceUrl && voiceUrl.startsWith("blob:"));
            if (isLocalFallback && replicateConfigured) {
              return (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-zinc-300">
                    <span className="font-semibold text-amber-400">File Sandbox-only Notice:</span> One or more of your uploaded files is currently on client-only fallback due to network size limits. For best results with active Replicate AI nodes, try uploading smaller audio files (e.g. under 10MB) that can successfully register on the server.
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">Source Vocal Stem</span>
              <p className="text-xs text-white font-medium truncate">{vocalsName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">Target Voice Sample</span>
              <p className="text-xs text-white font-medium truncate">{voiceName}</p>
            </div>
          </div>

          {cloneState === "idle" && !clonedUrl && (
            <button
              onClick={executeVoiceSwap}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 text-xs font-bold tracking-wide uppercase py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] transition-all"
            >
              <Cpu className="h-4.5 w-4.5 animate-pulse" /> Launch Neural Voice Morphing & Swap
            </button>
          )}

          {cloneState === "processing" && (
            <div className="bg-zinc-950/60 rounded-xl p-5 border border-zinc-800/80 text-center space-y-3">
              <Loader2 className="h-7 w-7 text-teal-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-white">Performing RVC Voice Clone conversion...</p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">{progressMessage}</p>
              </div>
            </div>
          )}

          {cloneState === "error" && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 text-center space-y-3">
              <p className="text-xs text-red-400 font-medium">{progressMessage}</p>
              <button
                onClick={executeVoiceSwap}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 px-3.5 py-1.5 rounded-lg border border-red-500/20"
              >
                <RefreshCw className="h-3 w-3" /> Retry Swapping
              </button>
            </div>
          )}

          {clonedUrl && (
            <div className="space-y-3">
              {cloneWarning && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-zinc-300">
                    <span className="font-semibold text-amber-400">Sandbox Fallback:</span> {cloneWarning}
                  </div>
                </div>
              )}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Synthesized Vocal
                    </span>
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                  </div>
                  <p className="text-xs text-white font-medium">Cloned_Vocal_Stem.mp3</p>
                </div>
                <audio
                  className="h-8 max-w-full lg:max-w-xs outline-none"
                  src={clonedUrl}
                  controls
                />
              </div>

              {cloneState === "success" && (
                <div className="flex justify-end">
                  <button
                    onClick={executeVoiceSwap}
                    className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Re-render Voice Clone
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
