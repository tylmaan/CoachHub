import { act, renderHook } from '@testing-library/react'
import { useAutosave } from '@/hooks/useAutosave'

const DELAY = 800

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

type Value = string | { text: string }

function setup(initial: Value, save: (value: Value) => Promise<void>, enabled = true) {
  return renderHook(
    ({ value, enabled: on, saveFn }) => useAutosave(value, saveFn, on),
    { initialProps: { value: initial, enabled, saveFn: save } },
  )
}

describe('useAutosave', () => {
  it('starts as saved and does not save anything on its own', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = setup('a', save)

    await advance(5000)

    expect(result.current.status).toBe('saved')
    expect(save).not.toHaveBeenCalled()
  })

  it('saves the changed value after the debounce delay', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = setup('a', save)

    rerender({ value: 'ab', enabled: true, saveFn: save })
    expect(result.current.status).toBe('pending')

    await advance(DELAY - 1)
    expect(save).not.toHaveBeenCalled()

    await advance(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('ab')
    expect(result.current.status).toBe('saved')
  })

  it('restarts the delay on every change and saves only the latest value once', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { rerender } = setup('a', save)

    rerender({ value: 'b', enabled: true, saveFn: save })
    await advance(500)
    rerender({ value: 'bc', enabled: true, saveFn: save })
    await advance(DELAY - 1)
    expect(save).not.toHaveBeenCalled()

    await advance(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('bc')
  })

  it('does not save while disabled, and saves once enabled', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = setup('a', save, false)

    rerender({ value: 'b', enabled: false, saveFn: save })
    await advance(5000)
    expect(save).not.toHaveBeenCalled()
    expect(result.current.status).toBe('pending')

    rerender({ value: 'b', enabled: true, saveFn: save })
    await advance(DELAY)
    expect(save).toHaveBeenCalledWith('b')
  })

  it('treats equal object values as unchanged', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = setup({ text: 'a' }, save)

    rerender({ value: { text: 'a' }, enabled: true, saveFn: save })
    await advance(5000)

    expect(result.current.status).toBe('saved')
    expect(save).not.toHaveBeenCalled()
  })

  it('reports saving while the request is in flight', async () => {
    let finish!: () => void
    const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const { result, rerender } = setup('a', save)

    rerender({ value: 'b', enabled: true, saveFn: save })
    await advance(DELAY)
    expect(result.current.status).toBe('saving')

    await act(async () => finish())
    expect(result.current.status).toBe('saved')
  })

  it('saves again after the in-flight request when the value changed meanwhile', async () => {
    const resolvers: Array<() => void> = []
    const save = vi.fn(() => new Promise<void>((resolve) => { resolvers.push(resolve) }))
    const { result, rerender } = setup('a', save)

    rerender({ value: 'b', enabled: true, saveFn: save })
    await advance(DELAY)
    rerender({ value: 'bc', enabled: true, saveFn: save })

    await act(async () => resolvers[0]())
    expect(result.current.status).toBe('pending')

    await advance(DELAY)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('bc')

    await act(async () => resolvers[1]())
    expect(result.current.status).toBe('saved')
  })

  it('always calls the most recent save function', async () => {
    const first = vi.fn().mockResolvedValue(undefined)
    const second = vi.fn().mockResolvedValue(undefined)
    const { rerender } = setup('a', first)

    rerender({ value: 'b', enabled: true, saveFn: first })
    rerender({ value: 'b', enabled: true, saveFn: second })
    await advance(DELAY)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('b')
  })

  describe('when saving fails', () => {
    it('reports an error and does not retry on its own', async () => {
      const save = vi.fn().mockRejectedValue(new Error('offline'))
      const { result, rerender } = setup('a', save)

      rerender({ value: 'b', enabled: true, saveFn: save })
      await advance(DELAY)
      await advance(10_000)

      expect(result.current.status).toBe('error')
      expect(save).toHaveBeenCalledTimes(1)
    })

    it('saves again when retry is called', async () => {
      const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
      const { result, rerender } = setup('a', save)
      rerender({ value: 'b', enabled: true, saveFn: save })
      await advance(DELAY)

      await act(async () => {
        await result.current.retry()
      })

      expect(save).toHaveBeenCalledTimes(2)
      expect(result.current.status).toBe('saved')
    })

    it('clears the error and saves again as soon as the value changes', async () => {
      const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
      const { result, rerender } = setup('a', save)
      rerender({ value: 'b', enabled: true, saveFn: save })
      await advance(DELAY)
      expect(result.current.status).toBe('error')

      rerender({ value: 'bc', enabled: true, saveFn: save })
      expect(result.current.status).toBe('pending')
      await advance(DELAY)

      expect(save).toHaveBeenLastCalledWith('bc')
      expect(result.current.status).toBe('saved')
    })
  })

  describe('flush', () => {
    it('saves immediately when there are unsaved changes', async () => {
      const save = vi.fn().mockResolvedValue(undefined)
      const { result, rerender } = setup('a', save)
      rerender({ value: 'b', enabled: true, saveFn: save })

      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.flush()
      })

      expect(outcome).toBe(true)
      expect(save).toHaveBeenCalledWith('b')
      expect(result.current.status).toBe('saved')
    })

    it('does nothing and succeeds when everything is saved', async () => {
      const save = vi.fn().mockResolvedValue(undefined)
      const { result } = setup('a', save)

      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.flush()
      })

      expect(outcome).toBe(true)
      expect(save).not.toHaveBeenCalled()
    })

    it('does nothing and succeeds when disabled', async () => {
      const save = vi.fn().mockResolvedValue(undefined)
      const { result, rerender } = setup('a', save, false)
      rerender({ value: 'b', enabled: false, saveFn: save })

      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.flush()
      })

      expect(outcome).toBe(true)
      expect(save).not.toHaveBeenCalled()
    })

    it('reports failure when the save fails', async () => {
      const save = vi.fn().mockRejectedValue(new Error('offline'))
      const { result, rerender } = setup('a', save)
      rerender({ value: 'b', enabled: true, saveFn: save })

      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.flush()
      })

      expect(outcome).toBe(false)
      expect(result.current.status).toBe('error')
    })

    it('reports failure while another save is still running', async () => {
      let finish!: () => void
      const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
      const { result, rerender } = setup('a', save)
      rerender({ value: 'b', enabled: true, saveFn: save })
      await advance(DELAY)

      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.flush()
      })
      await act(async () => finish())

      expect(outcome).toBe(false)
      expect(save).toHaveBeenCalledTimes(1)
    })
  })
})
