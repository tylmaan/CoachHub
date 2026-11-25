import { act, renderHook } from '@testing-library/react'
import { useHistory } from '@/hooks/useHistory'

describe('useHistory', () => {
  it('starts with the initial value and nothing to undo or redo', () => {
    const { result } = renderHook(() => useHistory('a'))

    expect(result.current.present).toBe('a')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('commits a new present and makes it undoable', () => {
    const { result } = renderHook(() => useHistory('a'))

    act(() => result.current.commit('b'))

    expect(result.current.present).toBe('b')
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('undoes and redoes step by step', () => {
    const { result } = renderHook(() => useHistory('a'))
    act(() => result.current.commit('b'))
    act(() => result.current.commit('c'))

    act(() => result.current.undo())
    expect(result.current.present).toBe('b')
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.present).toBe('a')
    expect(result.current.canUndo).toBe(false)

    act(() => result.current.redo())
    expect(result.current.present).toBe('b')

    act(() => result.current.redo())
    expect(result.current.present).toBe('c')
    expect(result.current.canRedo).toBe(false)
  })

  it('ignores undo and redo when there is nothing to do', () => {
    const { result } = renderHook(() => useHistory('a'))

    act(() => result.current.undo())
    act(() => result.current.redo())

    expect(result.current.present).toBe('a')
  })

  it('drops the redo stack when committing after an undo', () => {
    const { result } = renderHook(() => useHistory('a'))
    act(() => result.current.commit('b'))
    act(() => result.current.commit('c'))
    act(() => result.current.undo())

    act(() => result.current.commit('d'))

    expect(result.current.present).toBe('d')
    expect(result.current.canRedo).toBe(false)
    act(() => result.current.undo())
    expect(result.current.present).toBe('b')
  })

  it('keeps at most 100 undo steps', () => {
    const { result } = renderHook(() => useHistory(0))

    for (let i = 1; i <= 150; i++) act(() => result.current.commit(i))

    let steps = 0
    while (result.current.canUndo) {
      act(() => result.current.undo())
      steps++
    }

    expect(steps).toBe(100)
    expect(result.current.present).toBe(50)
  })

  it('keeps stable callbacks across renders', () => {
    const { result, rerender } = renderHook(() => useHistory('a'))
    const { commit, undo, redo } = result.current

    rerender()

    expect(result.current.commit).toBe(commit)
    expect(result.current.undo).toBe(undo)
    expect(result.current.redo).toBe(redo)
  })
})
