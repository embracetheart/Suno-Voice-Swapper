/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PipelineStep = 1 | 2 | 3 | 4;

export type StepState = 'idle' | 'processing' | 'success' | 'error';

export interface SunoTrack {
  name: string;
  size: number;
  duration?: number;
  originalUrl?: string;
  vocalsUrl?: string;
  instrumentalUrl?: string;
}

export interface TargetVoice {
  name: string;
  size: number;
  url?: string;
}

export interface ClonedResult {
  clonedVocalsUrl?: string;
  clonedMasterUrl?: string;
  reverbDepth?: number;
}
