import { act, renderHook } from '@testing-library/react'
import { usePersistentState } from '@/hooks/usePersistentState'

describe('usePersistentState', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistentState('k', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('restores a stored value from sessionStorage', () => {
    sessionStorage.setItem('k', JSON.stringify({ a: 1 }))

    const { result } = renderHook(() => usePersistentState('k', { a: 0 }))

    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('stores updates and re-renders with them', () => {
    const { result } = renderHook(() => usePersistentState('k', 'a'))

    act(() => result.current[1]('b'))

    expect(result.current[0]).toBe('b')
    expect(sessionStorage.getItem('k')).toBe('"b"')
  })

  it('round-trips booleans, numbers and null', () => {
    const bool = renderHook(() => usePersistentState('bool', true))
    act(() => bool.result.current[1](false))
    const num = renderHook(() => usePersistentState<number | null>('num', 1))
    act(() => num.result.current[1](null))

    expect(renderHook(() => usePersistentState('bool', true)).result.current[0]).toBe(false)
    expect(renderHook(() => usePersistentState<number | null>('num', 1)).result.current[0]).toBeNull()
  })

  it('keeps separate values per key', () => {
    const a = renderHook(() => usePersistentState('a', 0))
    const b = renderHook(() => usePersistentState('b', 0))

    act(() => a.result.current[1](1))

    expect(b.result.current[0]).toBe(0)
    expect(sessionStorage.getItem('b')).toBeNull()
  })

  it('falls back to the initial value when the stored text is not valid JSON', () => {
    sessionStorage.setItem('k', '{broken')

    const { result } = renderHook(() => usePersistentState('k', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('falls back to the initial value when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    const { result } = renderHook(() => usePersistentState('k', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('still updates the state when storage cannot be written', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => usePersistentState('k', 'a'))

    act(() => result.current[1]('b'))

    expect(result.current[0]).toBe('b')
  })
})
