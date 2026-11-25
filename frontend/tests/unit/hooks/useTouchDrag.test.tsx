import { useEffect } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Mock } from 'vitest'
import { COARSE_POINTER, useTouchDrag } from '@/hooks/useTouchDrag'

const HOLD = 350

interface Callbacks {
  onStart: Mock<(appearanceId: number) => void>
  onOver: Mock<(key: string) => void>
  onLeave: Mock<(key: string) => void>
  onDrop: Mock<(key: string) => void>
  onEnd: Mock<() => void>
}

function makeCallbacks(): Callbacks {
  return {
    onStart: vi.fn<(appearanceId: number) => void>(),
    onOver: vi.fn<(key: string) => void>(),
    onLeave: vi.fn<(key: string) => void>(),
    onDrop: vi.fn<(key: string) => void>(),
    onEnd: vi.fn<() => void>(),
  }
}

const consume = { current: () => false }
const consumeClick = () => consume.current()

function Harness({ enabled = true, callbacks }: { enabled?: boolean; callbacks: Callbacks }) {
  const drag = useTouchDrag(enabled, callbacks)
  useEffect(() => {
    consume.current = drag.consumeClick
  })
  return (
    <div>
      <div data-testid="source" {...drag.bind(7)}>
        drag me
      </div>
      <div data-testid="slot" data-drop-key="CB-1" />
      <div data-testid="bench" data-drop-key="bench" />
    </div>
  )
}

const getSource = () => screen.getAllByTestId('source')[0]

let pointerTarget: Element | null = null

beforeEach(() => {
  vi.useFakeTimers()
  pointerTarget = null
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    writable: true,
    value: () => pointerTarget,
  })
})

afterEach(() => {
  vi.useRealTimers()
  document.querySelectorAll('body > [data-testid="source"]').forEach((ghost) => ghost.remove())
})

const touch = (extra: Record<string, unknown> = {}) => ({
  pointerType: 'touch',
  pointerId: 1,
  clientX: 50,
  clientY: 300,
  ...extra,
})

function ghostElements() {
  return Array.from(document.body.children).filter((el) => el.getAttribute('data-testid') === 'source')
}

function holdAndStart(callbacks: Callbacks, target: Element | null = null) {
  pointerTarget = target
  render(<Harness callbacks={callbacks} />)
  fireEvent.pointerDown(getSource(), touch())
  act(() => {
    vi.advanceTimersByTime(HOLD)
  })
}

describe('useTouchDrag', () => {
  it('reports the pointer capability of the device', () => {
    expect(COARSE_POINTER).toBe(false)
  })

  it('does not start a drag before the hold time has passed', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)

    fireEvent.pointerDown(getSource(), touch())
    act(() => {
      vi.advanceTimersByTime(HOLD - 1)
    })

    expect(callbacks.onStart).not.toHaveBeenCalled()
    expect(ghostElements()).toHaveLength(0)
  })

  it('starts a drag after holding, with a floating copy of the element', () => {
    const callbacks = makeCallbacks()

    holdAndStart(callbacks)

    expect(callbacks.onStart).toHaveBeenCalledWith(7)
    const [ghost] = ghostElements() as HTMLElement[]
    expect(ghost).toBeDefined()
    expect(ghost.style.position).toBe('fixed')
    expect(ghost.style.pointerEvents).toBe('none')
  })

  it('vibrates when the device supports it', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })

    holdAndStart(makeCallbacks())

    expect(vibrate).toHaveBeenCalledWith(15)
    Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('ignores mouse and pen pointers', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)

    fireEvent.pointerDown(getSource(), touch({ pointerType: 'mouse' }))
    act(() => {
      vi.advanceTimersByTime(HOLD * 2)
    })

    expect(callbacks.onStart).not.toHaveBeenCalled()
  })

  it('attaches no handlers when disabled', () => {
    const callbacks = makeCallbacks()
    render(<Harness enabled={false} callbacks={callbacks} />)

    fireEvent.pointerDown(getSource(), touch())
    act(() => {
      vi.advanceTimersByTime(HOLD * 2)
    })

    expect(callbacks.onStart).not.toHaveBeenCalled()
  })

  it('cancels the pending drag when the finger moves too far before the hold time', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()

    fireEvent.pointerDown(source, touch())
    fireEvent.pointerMove(source, touch({ clientX: 50, clientY: 315 }))
    act(() => {
      vi.advanceTimersByTime(HOLD * 2)
    })

    expect(callbacks.onStart).not.toHaveBeenCalled()
  })

  it('tolerates small finger movement while waiting for the hold time', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()

    fireEvent.pointerDown(source, touch())
    fireEvent.pointerMove(source, touch({ clientX: 54, clientY: 304 }))
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    expect(callbacks.onStart).toHaveBeenCalledWith(7)
  })

  it('reports the drop target under the finger when the drag starts', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    pointerTarget = screen.getByTestId('slot')

    fireEvent.pointerDown(getSource(), touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    expect(callbacks.onOver).toHaveBeenCalledWith('CB-1')
  })

  it('reports leaving one target and entering another while moving', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()
    pointerTarget = screen.getByTestId('slot')
    fireEvent.pointerDown(source, touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    pointerTarget = screen.getByTestId('bench')
    fireEvent.pointerMove(source, touch({ clientX: 120, clientY: 340 }))

    expect(callbacks.onLeave).toHaveBeenCalledWith('CB-1')
    expect(callbacks.onOver).toHaveBeenLastCalledWith('bench')
  })

  it('does not repeat over events while staying on the same target', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()
    pointerTarget = screen.getByTestId('slot')
    fireEvent.pointerDown(source, touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    fireEvent.pointerMove(source, touch({ clientX: 60, clientY: 310 }))
    fireEvent.pointerMove(source, touch({ clientX: 70, clientY: 320 }))

    expect(callbacks.onOver).toHaveBeenCalledTimes(1)
  })

  it('moves the floating copy with the finger', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()
    fireEvent.pointerDown(source, touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    fireEvent.pointerMove(source, touch({ clientX: 120, clientY: 340 }))

    const [ghost] = ghostElements() as HTMLElement[]
    expect(ghost.style.left).toBe('70px')
    expect(ghost.style.top).toBe('40px')
  })

  it('drops on the target under the finger and removes the floating copy', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()
    pointerTarget = screen.getByTestId('bench')
    fireEvent.pointerDown(source, touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    fireEvent.pointerUp(source, touch())

    expect(callbacks.onDrop).toHaveBeenCalledWith('bench')
    expect(callbacks.onEnd).not.toHaveBeenCalled()
    expect(ghostElements()).toHaveLength(0)
  })

  it('ends the drag without a drop when released over nothing', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)

    fireEvent.pointerUp(getSource(), touch())

    expect(callbacks.onDrop).not.toHaveBeenCalled()
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1)
    expect(ghostElements()).toHaveLength(0)
  })

  it('ends the drag without a drop when the pointer is cancelled', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)
    pointerTarget = screen.getByTestId('slot')

    fireEvent.pointerCancel(getSource(), touch())

    expect(callbacks.onDrop).not.toHaveBeenCalled()
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1)
    expect(ghostElements()).toHaveLength(0)
  })

  it('ignores events of other pointers during a drag', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)
    const source = getSource()

    fireEvent.pointerUp(source, touch({ pointerId: 2 }))
    fireEvent.pointerCancel(source, touch({ pointerId: 2 }))

    expect(callbacks.onEnd).not.toHaveBeenCalled()
    expect(ghostElements()).toHaveLength(1)
  })

  it('does not start a second drag while one is active', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)

    fireEvent.pointerDown(getSource(), touch({ pointerId: 2 }))
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    expect(callbacks.onStart).toHaveBeenCalledTimes(1)
  })

  it('blocks page scrolling only while dragging', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)

    const duringDrag = new Event('touchmove', { cancelable: true })
    window.dispatchEvent(duringDrag)
    expect(duringDrag.defaultPrevented).toBe(true)

    fireEvent.pointerUp(getSource(), touch())

    const afterDrag = new Event('touchmove', { cancelable: true })
    window.dispatchEvent(afterDrag)
    expect(afterDrag.defaultPrevented).toBe(false)
  })

  it('suppresses the context menu only while dragging', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()

    expect(fireEvent.contextMenu(source)).toBe(true)

    fireEvent.pointerDown(source, touch())
    act(() => {
      vi.advanceTimersByTime(HOLD)
    })

    expect(fireEvent.contextMenu(source)).toBe(false)
  })

  it('swallows the click that follows a drag, but only once and only briefly', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)
    expect(consumeClick()).toBe(false)

    fireEvent.pointerUp(getSource(), touch())

    expect(consumeClick()).toBe(true)
    expect(consumeClick()).toBe(false)
  })

  it('stops swallowing clicks 400 ms after a drag', () => {
    const callbacks = makeCallbacks()
    holdAndStart(callbacks, null)
    fireEvent.pointerUp(getSource(), touch())

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(consumeClick()).toBe(false)
  })

  it('does not swallow clicks after a press that never became a drag', () => {
    const callbacks = makeCallbacks()
    render(<Harness callbacks={callbacks} />)
    const source = getSource()

    fireEvent.pointerDown(source, touch())
    fireEvent.pointerUp(source, touch())

    expect(consumeClick()).toBe(false)
    expect(callbacks.onEnd).not.toHaveBeenCalled()
  })

  describe('auto-scroll', () => {
    it('scrolls up while the finger is near the top edge', () => {
      const scrollBy = vi.spyOn(window, 'scrollBy')
      const callbacks = makeCallbacks()
      render(<Harness callbacks={callbacks} />)
      const source = getSource()
      fireEvent.pointerDown(source, touch())
      act(() => {
        vi.advanceTimersByTime(HOLD)
      })

      fireEvent.pointerMove(source, touch({ clientY: 20 }))
      act(() => {
        vi.advanceTimersByTime(20)
      })

      expect(scrollBy).toHaveBeenCalledWith(0, -12)
    })

    it('scrolls down while the finger is near the bottom edge', () => {
      const scrollBy = vi.spyOn(window, 'scrollBy')
      const callbacks = makeCallbacks()
      render(<Harness callbacks={callbacks} />)
      const source = getSource()
      fireEvent.pointerDown(source, touch())
      act(() => {
        vi.advanceTimersByTime(HOLD)
      })

      fireEvent.pointerMove(source, touch({ clientY: window.innerHeight - 10 }))
      act(() => {
        vi.advanceTimersByTime(20)
      })

      expect(scrollBy).toHaveBeenCalledWith(0, 12)
    })

    it('does not scroll in the middle of the screen, and stops after the drop', () => {
      const scrollBy = vi.spyOn(window, 'scrollBy')
      const callbacks = makeCallbacks()
      render(<Harness callbacks={callbacks} />)
      const source = getSource()
      fireEvent.pointerDown(source, touch())
      act(() => {
        vi.advanceTimersByTime(HOLD)
      })

      fireEvent.pointerMove(source, touch({ clientY: 300 }))
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(scrollBy).not.toHaveBeenCalled()

      fireEvent.pointerMove(source, touch({ clientY: 20 }))
      fireEvent.pointerUp(source, touch({ clientY: 20 }))
      scrollBy.mockClear()
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(scrollBy).not.toHaveBeenCalled()
    })
  })
})
