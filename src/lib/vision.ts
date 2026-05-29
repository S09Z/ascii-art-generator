import { FilesetResolver } from '@mediapipe/tasks-vision';

// Shared WASM runtime — loaded once, reused by both segment.ts and detect.ts
let promise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

export function getVision() {
  if (!promise) {
    promise = FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );
  }
  return promise;
}
