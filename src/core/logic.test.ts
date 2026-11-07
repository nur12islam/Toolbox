import { describe, expect, it } from 'vitest'
import {
  convertUnit,
  countText,
  findQualityForTarget,
  fitImageDimensions,
  hexToRgb,
  rgbToHsl,
} from './logic'

describe('unit conversion', () => {
  it('converts kilometers to meters and temperatures', () => {
    expect(convertUnit(2, 'Kilometers', 'Meters', 'Length')).toBe(2000)
    expect(convertUnit(32, 'Fahrenheit', 'Celsius', 'Temperature')).toBe(0)
    expect(convertUnit(0, 'Celsius', 'Kelvin', 'Temperature')).toBeCloseTo(273.15)
  })
})

describe('word counter', () => {
  it('counts words, punctuation, paragraphs, and reading time', () => {
    expect(countText("Hi, world!\n\nIt's fine.")).toEqual({
      words: 4,
      chars: 22,
      charsNoSpaces: 18,
      sentences: 2,
      paragraphs: 2,
      minutes: 1,
    })
  })
})

describe('color conversion', () => {
  it('converts HEX to RGB and RGB to HSL', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 })
  })
})

describe('image fitting', () => {
  it('fits within bounds while preserving aspect ratio', () => {
    expect(fitImageDimensions(4000, 2000, 1000, 1000)).toEqual({ width: 1000, height: 500 })
  })
})

describe('target-size quality search', () => {
  it('finds an output size inside the requested range', async () => {
    const result = await findQualityForTarget(async (quality) => 512 - quality * 400, 0.1, 0.3)
    expect(result.withinTarget).toBe(true)
    expect(result.sizeBytes).toBeGreaterThanOrEqual(0.1 * 1024)
    expect(result.sizeBytes).toBeLessThanOrEqual(0.3 * 1024)
  })

  it('reports impossible minimum sizes', async () => {
    const result = await findQualityForTarget(async (quality) => 100 + quality * 100, 0.4, 0.5)
    expect(result.withinTarget).toBe(false)
  })
})
