/**
 * Keeps the filled part of every range slider in sync (the --p custom property).
 * Runs on user input and whenever React changes a slider's value, min or max.
 */
const sync = (slider: HTMLInputElement) => {
  const min = Number(slider.min || 0)
  const max = Number(slider.max || 100)
  const value = Number(slider.value)
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0
  slider.style.setProperty('--p', `${percent}%`)
}

const syncAll = () => {
  document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(sync)
}

export function initRangeFill() {
  document.addEventListener(
    'input',
    (event) => {
      const target = event.target
      if (target instanceof HTMLInputElement && target.type === 'range') sync(target)
    },
    true,
  )
  let scheduled = false
  new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      syncAll()
    })
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['value', 'min', 'max'],
  })
  syncAll()
}
