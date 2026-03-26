export interface PartData {
  positions: [number, number, number][];   // x, y, z в метрах
  rotations: [number, number, number][];   // rx, ry, rz в радианах
}

export interface AnimationData {
  times: number[];
  parts: {
    'Car body': PartData;
    'Wheelset1.WSet': PartData;
    'Wheelset2.WSet': PartData;
  };
}

export type ViewType = 'front' | 'side' | 'top' | 'isometric';