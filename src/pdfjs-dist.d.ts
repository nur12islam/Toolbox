declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc: string }
  export function getDocument(source: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number
      getPage(pageNumber: number): Promise<{
        getViewport(options: { scale: number }): { width: number; height: number }
        render(options: {
          canvasContext: CanvasRenderingContext2D
          viewport: { width: number; height: number }
        }): { promise: Promise<void> }
        cleanup(): void
      }>
      destroy(): void
    }>
  }
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' {
  const url: string
  export default url
}
