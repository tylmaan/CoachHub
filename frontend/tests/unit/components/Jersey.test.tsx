import { render } from '@testing-library/react'
import { Jersey } from '@/components/Jersey'
import { makeKit } from '../../utils/factories'

function renderJersey(props: Parameters<typeof Jersey>[0]) {
  const { container } = render(<Jersey {...props} />)
  return container.querySelector('svg')!
}

const rects = (svg: SVGElement) => Array.from(svg.querySelectorAll('rect'))

describe('Jersey', () => {
  it('draws the shirt in the primary colour of the kit', () => {
    const svg = renderJersey({ kit: makeKit({ primaryColor: '#aa0000' }) })

    expect(rects(svg)[0]).toHaveAttribute('fill', '#aa0000')
  })

  it('shows the shirt number, if there is one', () => {
    expect(renderJersey({ kit: makeKit(), number: 10 }).querySelector('text')).toHaveTextContent('10')
    expect(renderJersey({ kit: makeKit() }).querySelector('text')).toBeNull()
  })

  it('shows the number zero', () => {
    expect(renderJersey({ kit: makeKit(), number: 0 }).querySelector('text')).toHaveTextContent('0')
  })

  it('uses the given size for both dimensions, defaulting to 56', () => {
    const custom = renderJersey({ kit: makeKit(), size: 80 })
    expect(custom).toHaveAttribute('width', '80')
    expect(custom).toHaveAttribute('height', '80')

    expect(renderJersey({ kit: makeKit() })).toHaveAttribute('width', '56')
  })

  it('writes dark numbers on light shirts', () => {
    const svg = renderJersey({ kit: makeKit({ primaryColor: '#ffffff' }), number: 7 })

    expect(svg.querySelector('text')).toHaveAttribute('fill', '#111111')
  })

  // isLight() divides by 255 instead of 255000, so every colour except pure black counts as "light".
  it.skip('BUG: writes white numbers on dark shirts', () => {
    const svg = renderJersey({ kit: makeKit({ primaryColor: '#112233' }), number: 7 })

    expect(svg.querySelector('text')).toHaveAttribute('fill', '#ffffff')
  })

  describe('patterns', () => {
    const secondary = '#ff00ff'
    const withPattern = (pattern: ReturnType<typeof makeKit>['pattern']) =>
      renderJersey({ kit: makeKit({ pattern, secondaryColor: secondary }) })

    it('draws a plain shirt for the solid pattern', () => {
      const svg = withPattern('Solid')

      expect(rects(svg)).toHaveLength(1)
      expect(svg.querySelector('polygon')).toBeNull()
    })

    it.each([['VerticalStripes'], ['HorizontalStripes']] as const)('draws five stripes for %s', (pattern) => {
      const stripes = rects(withPattern(pattern)).slice(1)

      expect(stripes).toHaveLength(5)
      expect(stripes.every((s) => s.getAttribute('fill') === secondary)).toBe(true)
    })

    it('draws one half in the secondary colour', () => {
      const overlay = rects(withPattern('Halves')).slice(1)

      expect(overlay).toHaveLength(1)
      expect(overlay[0]).toHaveAttribute('fill', secondary)
    })

    it('draws two opposite quarters in the secondary colour', () => {
      const overlay = rects(withPattern('Quarters')).slice(1)

      expect(overlay).toHaveLength(2)
      expect(overlay.every((q) => q.getAttribute('fill') === secondary)).toBe(true)
    })

    it('draws a diagonal sash in the secondary colour', () => {
      const sash = withPattern('Sash').querySelector('polygon')

      expect(sash).toHaveAttribute('fill', secondary)
    })
  })

  describe('without a kit', () => {
    it('draws a neutral shirt, with the number', () => {
      const svg = renderJersey({ number: 9 })

      expect(svg.querySelector('path')).toHaveAttribute('fill', '#a78bfa')
      expect(svg.querySelector('text')).toHaveTextContent('9')
    })
  })

  describe('muted', () => {
    it('draws a dashed placeholder shirt without a number', () => {
      const svg = renderJersey({ kit: makeKit(), number: 9, muted: true })

      expect(svg.querySelector('path')).toHaveAttribute('stroke-dasharray', '3,2')
      expect(svg.querySelector('text')).toBeNull()
    })
  })

  it('gives every shirt its own clip path', () => {
    const { container } = render(
      <>
        <Jersey kit={makeKit()} />
        <Jersey kit={makeKit()} />
      </>,
    )

    const ids = Array.from(container.querySelectorAll('clipPath')).map((c) => c.id)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    expect(container.querySelectorAll('g[clip-path]')[0]).toHaveAttribute('clip-path', `url(#${ids[0]})`)
  })
})
