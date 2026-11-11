export type TextStats = {
  words: number
  chars: number
  charsNoSpaces: number
  sentences: number
  paragraphs: number
  minutes: number
}

export function countText(text: string): TextStats {
  const words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []
  const sentences = text.trim()
    ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).filter((part) => part.trim()).length
    : 0
  const paragraphs = text.trim()
    ? text
        .trim()
        .split(/\n\s*\n/)
        .filter((part) => part.trim()).length
    : 0
  return {
    words: words.length,
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    sentences,
    paragraphs,
    minutes: words.length ? Math.max(1, Math.ceil(words.length / 200)) : 0,
  }
}

export function fitImageDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  keepAspect = true,
) {
  const safeWidth = Math.max(1, maxWidth || width)
  const safeHeight = Math.max(1, maxHeight || height)
  if (!keepAspect) return { width: safeWidth, height: safeHeight }
  const scale = Math.min(safeWidth / width, safeHeight / height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function hexToRgb(hex: string) {
  const value = hex.replace(/^#/, '')
  const expanded = value.length === 3 ? [...value].map((char) => char + char).join('') : value
  if (!/^[\da-f]{6}$/i.test(expanded)) throw new Error('Enter a valid HEX color.')
  const integer = Number.parseInt(expanded, 16)
  return { r: (integer >> 16) & 255, g: (integer >> 8) & 255, b: integer & 255 }
}

export function rgbToHsl(r: number, g: number, b: number) {
  const [red, green, blue] = [r, g, b].map((channel) => channel / 255)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0
  let saturation = 0
  const lightness = (max + min) / 2
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6
    else if (max === green) hue = ((blue - red) / delta + 2) / 6
    else hue = ((red - green) / delta + 4) / 6
  }
  return {
    h: Math.round(hue * 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

const unitGroups: Record<
  string,
  { label: string; temperature?: true; units: Record<string, number> }
> = {
  Length: {
    label: 'Length',
    units: {
      Meters: 1,
      Kilometers: 1000,
      Centimeters: 0.01,
      Millimeters: 0.001,
      Miles: 1609.344,
      Yards: 0.9144,
      Feet: 0.3048,
      Inches: 0.0254,
    },
  },
  Weight: {
    label: 'Weight',
    units: {
      Kilograms: 1,
      Grams: 0.001,
      Milligrams: 0.000001,
      Pounds: 0.45359237,
      Ounces: 0.028349523125,
      'Metric tons': 1000,
    },
  },
  Temperature: {
    label: 'Temperature',
    temperature: true,
    units: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  },
  Area: {
    label: 'Area',
    units: {
      'Square meters': 1,
      'Square kilometers': 1e6,
      Hectares: 10000,
      Acres: 4046.8564224,
      'Square feet': 0.09290304,
      'Square yards': 0.83612736,
    },
  },
  Volume: {
    label: 'Volume',
    units: {
      Liters: 1,
      Milliliters: 0.001,
      'Cubic meters': 1000,
      'US gallons': 3.785411784,
      'US cups': 0.2365882365,
      'US fluid ounces': 0.0295735296,
    },
  },
  Speed: {
    label: 'Speed',
    units: {
      'Meters/second': 1,
      'Kilometers/hour': 1 / 3.6,
      'Miles/hour': 0.44704,
      Knots: 0.514444,
    },
  },
  Data: {
    label: 'Data size',
    units: {
      Bytes: 1,
      'Kilobytes (KB)': 1000,
      'Megabytes (MB)': 1e6,
      'Gigabytes (GB)': 1e9,
      'Kibibytes (KiB)': 1024,
      'Mebibytes (MiB)': 1048576,
      'Gibibytes (GiB)': 1073741824,
    },
  },
}

export const unitGroupNames = Object.keys(unitGroups)
export const getUnits = (group: string) => Object.keys(unitGroups[group].units)
export const getUnitGroupLabel = (group: string) => unitGroups[group].label

export function convertUnit(value: number, from: string, to: string, group: string) {
  const units = unitGroups[group]
  if (!units) throw new Error('Unknown measurement group.')
  let base = value
  if (group === 'Temperature') {
    if (from === 'Fahrenheit') base = ((value - 32) * 5) / 9
    else if (from === 'Kelvin') base = value - 273.15
  } else base = value * (units.units[from] || 1)
  if (group === 'Temperature') {
    if (to === 'Fahrenheit') return (base * 9) / 5 + 32
    if (to === 'Kelvin') return base + 273.15
    return base
  }
  return base / (units.units[to] || 1)
}

export type QualityResult = { quality: number; sizeBytes: number; withinTarget: boolean }

export async function findQualityForTarget(
  measureSize: (quality: number) => Promise<number>,
  minKB: number,
  maxKB: number,
  iterations = 12,
  maximumQuality = 1,
): Promise<QualityResult> {
  const minBytes = Math.max(0, minKB) * 1024
  const maxBytes = Math.max(minKB, maxKB) * 1024
  let low = 0.05
  let high = Math.min(1, Math.max(0.05, maximumQuality))
  let best: QualityResult | null = null
  for (let index = 0; index < iterations; index++) {
    const quality = (low + high) / 2
    const sizeBytes = await measureSize(quality)
    if (sizeBytes > maxBytes) high = quality
    else {
      if (sizeBytes >= minBytes) best = { quality, sizeBytes, withinTarget: true }
      low = quality
    }
  }
  const smallest = await measureSize(0.05)
  if (best) return best
  return {
    quality: 0.05,
    sizeBytes: smallest,
    withinTarget: smallest >= minBytes && smallest <= maxBytes,
  }
}
