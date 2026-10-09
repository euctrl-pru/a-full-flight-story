declare module 'scrollama' {
  export interface StepEvent { element: HTMLElement; index: number; direction: 'up' | 'down' }
  export interface ProgressEvent { element: HTMLElement; index: number; progress: number; direction: 'up' | 'down' }
  export interface Scroller {
    setup(opts: { step: string | Element[] | NodeListOf<Element>; offset?: number; progress?: boolean; threshold?: number; debug?: boolean }): Scroller;
    onStepEnter(cb: (e: StepEvent) => void): Scroller;
    onStepExit(cb: (e: StepEvent) => void): Scroller;
    onStepProgress(cb: (e: ProgressEvent) => void): Scroller;
    resize(): Scroller;
    destroy(): void;
  }
  export default function scrollama(): Scroller;
}
