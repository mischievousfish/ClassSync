export type OMRBubbleState = 'FILLED' | 'EMPTY' | 'ERASED_MULTIPLE_MARKS';

export interface OMRAlignmentInput {
  fiducials: Array<{ x: number; y: number }>; 
  width: number;
  height: number;
  skewDegrees?: number;
}

export interface OMRAlignmentResult {
  rotationDegrees: number;
  scaleX: number;
  scaleY: number;
  transformApplied: boolean;
  alignedWidth: number;
  alignedHeight: number;
}

export class OMRFormAligner {
  align(input: OMRAlignmentInput): OMRAlignmentResult {
    const fiducials = input.fiducials; 

    if (fiducials.length < 4) {
      return {
        rotationDegrees: 0,
        scaleX: 1,
        scaleY: 1,
        transformApplied: false,
        alignedWidth: input.width,
        alignedHeight: input.height,
      };
    }

    const centroidX = fiducials.reduce((sum, point) => sum + point.x, 0) / fiducials.length;
    const centroidY = fiducials.reduce((sum, point) => sum + point.y, 0) / fiducials.length;

    const rotationDegrees = Number(((Math.atan2(centroidY - input.height / 2, centroidX - input.width / 2) * 180) / Math.PI).toFixed(2));
    const scaleX = Math.max(0.8, Math.min(1.2, input.width / Math.max(1, Math.abs(fiducials[2].x - fiducials[0].x))));
    const scaleY = Math.max(0.8, Math.min(1.2, input.height / Math.max(1, Math.abs(fiducials[3].y - fiducials[1].y))));

    return {
      rotationDegrees,
      scaleX: Number(scaleX.toFixed(4)),
      scaleY: Number(scaleY.toFixed(4)),
      transformApplied: true,
      alignedWidth: Math.round(input.width * scaleX),
      alignedHeight: Math.round(input.height * scaleY),
    };
  }
}
