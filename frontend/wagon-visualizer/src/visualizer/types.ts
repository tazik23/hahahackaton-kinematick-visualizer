// src/visualizer/types.ts
export interface TrajectoryData {
  time: number[];
  details: {
    [key: string]: {           // detail_1, detail_2, ...
      name: string;            // "Car body", "Wheelset1", "Wheelset2" и т.д.
      position: [number, number, number][];   // [x, y, z]
      angles: [number, number, number][];     // [rx, ry, rz] в радианах
    };
  };
}

// Внутренний формат (удобный для Three.js)
export interface PartAnimation {
  positions: [number, number, number][];
  rotations: [number, number, number][];
}

export interface AnimationData {
  times: number[];
  parts: Record<string, PartAnimation>;   // ключ = name детали
}

export type ViewType = 'front' | 'side' | 'top' | 'isometric';