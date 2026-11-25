class SizedResizeObserver {
  private callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    const rect = { width: 800, height: 400, top: 0, left: 0, bottom: 400, right: 800, x: 0, y: 0, toJSON: () => ({}) }
    this.callback([{ target, contentRect: rect } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }

  unobserve() {}
  disconnect() {}
}

export function installSizedCharts() {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SizedResizeObserver)
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
  })
}

export function chartLabels(container: HTMLElement | Element): string[] {
  const seen = new Set<string>()
  for (const node of container.querySelectorAll('svg text')) {
    const text = node.textContent?.trim()
    if (text) seen.add(text)
  }
  return [...seen]
}
