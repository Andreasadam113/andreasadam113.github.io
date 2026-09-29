/**
 * Stadium field dimensions in world units (a scaled field-hockey pitch, 91.4 × 55 m).
 * Shared by the 3D stadium and the 2D fallback map.
 */
export const FIELD = {
  length: 28,
  width: 17,
  /** 23 m lines, measured from the centre line. */
  quarter: 7,
  /** Shooting-circle radius. */
  circle: 4.5,
  /** Green run-off area around the blue turf. */
  margin: 1.6,
}

/** Rotation that makes a project object face away from the centre spot (towards the stands). */
export const faceOut = (x: number, z: number): [number, number, number] => [0, Math.atan2(x, z), 0]

/** Rotation that makes a project object face the centre spot (the camera then views it from the pitch side). */
export const faceIn = (x: number, z: number): [number, number, number] => [0, Math.atan2(-x, -z), 0]
