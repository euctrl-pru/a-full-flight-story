export interface XY { x: number; y: number }
export interface LineSeries { id: string; label: string; color: string; width?: number; dash?: string; points: XY[] }
export interface Bar { key: string; label: string; value: number; color?: string; emphasis?: boolean }
export interface Column { key: string; label: string; format?: (v: any) => string }
export interface TableSpec { caption: string; columns: Column[]; rows: Record<string, unknown>[] }
