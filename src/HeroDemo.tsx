import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowRight, Check } from 'lucide-react'

const query = '(prefers-reduced-motion: reduce)'
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )

const labels = ['Pick a form preset', 'Fitting to 200 × 230 px…', 'Under 50 KB — ready to upload']

/** Looping product shot of the hero tool. Decorative: the same information is in the page copy. */
export function HeroDemo() {
  const reduce = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setTick((value) => value + 1), 1900)
    return () => window.clearInterval(id)
  }, [reduce])
  const stage = reduce ? 2 : tick % 3

  return (
    <div className="demo glass" aria-hidden="true" data-stage={stage}>
      <div className="demo-bar">
        <i />
        <i />
        <i />
        <span>Photo &amp; Signature Fixer</span>
      </div>
      <div className="demo-body">
        <div className="demo-file">
          <div className="demo-photo">
            <span className="art-person" />
          </div>
          <strong>photo.jpg</strong>
          <small>3024 × 4032 px · 2.4 MB</small>
        </div>
        <div className="demo-mid">
          <span className="demo-progress">
            <span />
          </span>
          <span className="demo-label">{labels[stage]}</span>
          <ArrowRight size={18} className="demo-arrow" />
        </div>
        <div className="demo-file demo-out">
          <div className="demo-photo small">
            <span className="art-person" />
            <span className="demo-check">
              <Check size={13} strokeWidth={3} />
            </span>
          </div>
          <strong>Ready for the form</strong>
          <small>
            200 × 230 px · <b>48 KB</b>
          </small>
        </div>
      </div>
    </div>
  )
}
