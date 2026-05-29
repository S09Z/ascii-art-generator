import { FaceDetector } from '@mediapipe/tasks-vision';
import { getVision } from './vision';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

let detectorPromise: Promise<FaceDetector> | null = null;

function getDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = getVision().then((vision) =>
      FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      })
    );
  }
  return detectorPromise;
}

export async function detectFace(image: HTMLImageElement): Promise<FaceBox | null> {
  const detector = await getDetector();
  const result = detector.detect(image);
  if (!result.detections.length) return null;
  const box = result.detections[0].boundingBox!;
  return { x: box.originX, y: box.originY, width: box.width, height: box.height };
}
