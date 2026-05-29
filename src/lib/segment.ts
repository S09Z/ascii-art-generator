import { ImageSegmenter } from '@mediapipe/tasks-vision';
import { getVision } from './vision';

export type SegmentMask = { data: Float32Array; width: number; height: number };

// Singleton — loaded once, reused for every call
let segmenterPromise: Promise<ImageSegmenter> | null = null;

function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = getVision().then((vision) =>
      ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
          delegate: 'CPU',
        },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        runningMode: 'IMAGE',
      })
    );
  }
  return segmenterPromise;
}

export async function segmentPerson(image: HTMLImageElement): Promise<SegmentMask> {
  const segmenter = await getSegmenter();
  const result = segmenter.segment(image);
  const maskObj = result.confidenceMasks![0];
  // Copy data out of WASM memory before closing the result
  const data = maskObj.getAsFloat32Array().slice();
  const { width, height } = maskObj;
  result.close();
  return { data, width, height };
}
