import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { flushSync } from 'react-dom'
import { categories, searchTools, tools } from './tools/registry'
import { HeroDemo } from './HeroDemo'
import { TileArt, tileSize } from './tiles'
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Globe,
  Grid2X2,
  Info,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'

const REPO = 'https://github.com/nur12islam/Toolbox'
const DARKI = 'https://me.darki.online'
const steps = [
  {
    n: 1,
    title: 'Pick a tool',
    text: 'Search or browse the cards. Every tool says exactly what it does.',
  },
  {
    n: 2,
    title: 'Add your file',
    text: 'Drag it in or tap to choose it. It never leaves your device.',
  },
  {
    n: 3,
    title: 'Download the result',
    text: 'Tweak the options, preview it live, then save it in one click.',
  },
]

const stagger = (index: number) => ({ '--i': index }) as CSSProperties

/** Category filter. A duplicate "active" row is clipped to the selected chip, so one crimson pill slides between chips. */
function CategoryTabs({
  value,
  onChange,
}: {
  value: string
  onChange: (category: string) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const chip = track.querySelector<HTMLElement>('[data-selected="true"]')
      if (!chip) return
      track.style.setProperty('--cl', `${chip.offsetLeft - 3}px`)
      track.style.setProperty(
        '--cr',
        `${track.offsetWidth - chip.offsetLeft - chip.offsetWidth - 3}px`,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    void document.fonts?.ready.then(measure)
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])
  return (
    <div className="category-scroller">
      <div className="category-track" ref={trackRef}>
        <div className="category-list" role="group" aria-label="Filter tools by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="category"
              aria-pressed={value === c}
              data-selected={value === c}
              onClick={() => onChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={animate ? 'category-list on anim' : 'category-list on'} aria-hidden="true">
          {categories.map((c) => (
            <span key={c} className="category">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToolSkeleton() {
  return (
    <div className="tool-skeleton" role="status">
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span className="sr-only">Loading tool…</span>
    </div>
  )
}

function Footer({ onHome, onAbout }: { onHome: () => void; onAbout: () => void }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <button className="brand" onClick={onHome} aria-label="ToolBox Online home">
            <span className="brand-mark">
              <Grid2X2 size={18} />
            </span>
            <span>
              ToolBox<span className="brand-light"> Online</span>
            </span>
          </button>
          <p className="tag">
            Free tools for students and creators. Simple, fast and private. Everything runs in your
            browser.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <div className="footer-links">
            <button onClick={onHome}>All tools</button>
            <button onClick={onAbout}>About</button>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div>
          <h4>Project</h4>
          <div className="footer-links">
            <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
              Report an issue
            </a>
            <a href={REPO} target="_blank" rel="noreferrer">
              Contribute
            </a>
            <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
              MIT License
            </a>
          </div>
        </div>
      </div>
      <div className="footer-credit glass">
        <span>Created by</span>
        <a href={DARKI} target="_blank" rel="noreferrer">
          DARKI 🌐 me.darki.online <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ToolBox Online · Open source</span>
        <span>Useful by design. Private by default.</span>
      </div>
    </footer>
  )
}

type Route = { page: string; active: string }

/** Pure hash → route mapping, so the initial state needs no effect. */
function parseRoute(hash: string): Route {
  if (hash === '#/about') return { page: 'about', active: '' }
  if (hash.startsWith('#/tool/')) {
    const id = decodeURIComponent(hash.slice('#/tool/'.length))
    return tools.some((tool) => tool.id === id)
      ? { page: 'tools', active: id }
      : { page: 'not-found', active: '' }
  }
  return { page: 'tools', active: '' }
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

/** Gives a tool card's icon the shared view-transition name so it morphs into the tool page icon. */
const nameCardIcon = (id?: string) => {
  if (!id) return
  document
    .querySelector<HTMLElement>(`[data-tool="${id}"] .card-icon`)
    ?.style.setProperty('view-transition-name', 'tool-icon')
}

/** Runs a navigation inside a View Transition when the browser supports it (instant otherwise). */
function withTransition(update: () => void, from?: string, to?: string) {
  const doc = document as TransitionDocument
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) {
    update()
    return
  }
  nameCardIcon(from)
  const transition = doc.startViewTransition(() => {
    flushSync(update)
    nameCardIcon(to)
  })
  void transition.finished.finally(() => {
    document
      .querySelectorAll<HTMLElement>('.card-icon')
      .forEach((icon) => icon.style.removeProperty('view-transition-name'))
  })
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  const { page, active } = route
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All tools')
  const [focused, setFocused] = useState(false)
  const [sel, setSel] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = tools.find((t) => t.id === active)
  const SelectedIcon = selected?.icon
  const filtered = searchTools(query).filter(
    (tool) => category === 'All tools' || tool.category === category,
  )
  const results = query.trim() ? searchTools(query).slice(0, 6) : []
  const SelectedTool = selected?.component

  const applyRoute = useCallback(() => setRoute(parseRoute(window.location.hash)), [])

  const navigate = (hash: string, from?: string, to?: string) => {
    withTransition(
      () => {
        window.location.hash = hash
        applyRoute()
        setQuery('')
        setFocused(false)
        window.scrollTo(0, 0)
      },
      from,
      to,
    )
  }
  const open = (id: string) => navigate(`/tool/${id}`, id)
  const goHome = () => navigate('/', undefined, active || undefined)
  const goAbout = () => navigate('/about')
  const focusSearch = () => {
    if (page === 'tools' && !selected) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.setTimeout(() => searchRef.current?.focus(), 250)
    } else {
      navigate('/')
      window.setTimeout(() => searchRef.current?.focus(), 350)
    }
  }

  useEffect(() => {
    window.addEventListener('hashchange', applyRoute)
    return () => window.removeEventListener('hashchange', applyRoute)
  }, [applyRoute])
  useEffect(() => {
    document.title =
      page === 'about'
        ? 'About · ToolBox Online'
        : page === 'not-found'
          ? 'Not found · ToolBox Online'
          : selected
            ? `${selected.name} · ToolBox Online`
            : 'ToolBox Online — useful tools, no uploads'
  }, [page, selected])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        window.location.hash = '/'
        setTimeout(() => {
          searchRef.current?.focus()
          searchRef.current?.select()
        }, 60)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[sel]) {
      open(results[sel].id)
    } else if (e.key === 'Escape') {
      setFocused(false)
      searchRef.current?.blur()
    }
  }
  const glow = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  }
  const onHome = page === 'tools' && !selected
  return (
    <div className="app-shell">
      <header className="topbar glass">
        <button className="brand" onClick={goHome} aria-label="ToolBox Online home">
          <span className="brand-mark">
            <Grid2X2 size={19} />
          </span>
          <span>
            ToolBox<span className="brand-light"> Online</span>
          </span>
        </button>
        <nav className="nav" aria-label="Main">
          <button className={onHome ? 'nav-link active' : 'nav-link'} onClick={goHome}>
            All tools
          </button>
          <button className={page === 'about' ? 'nav-link active' : 'nav-link'} onClick={goAbout}>
            About
          </button>
          <a className="nav-link" href={REPO} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={14} />
          </a>
          <a className="nav-credit" href={DARKI} target="_blank" rel="noreferrer">
            By DARKI 🌐
          </a>
        </nav>
      </header>

      {page === 'about' ? (
        <main className="content about-page">
          <span className="eyebrow">THE IDEA</span>
          <h1>
            Useful tools.
            <br />
            <span className="accent">Less friction.</span>
          </h1>
          <p className="hero-copy">
            ToolBox Online is a community-built collection of small, practical utilities for
            students and creators. No sign-ups, no clutter. Most file tools run right in your
            browser.
          </p>
          <div className="about-grid">
            <div className="feature-card">
              <ShieldCheck />
              <h3>Privacy-first</h3>
              <p>
                Most tools process files locally. Background Remover sends images to remove.bg for
                processing.
              </p>
            </div>
            <div className="feature-card">
              <LockKeyhole />
              <h3>Free &amp; open source</h3>
              <p>
                Inspect the code, report issues, suggest ideas, or contribute improvements on
                GitHub.
              </p>
            </div>
            <div className="feature-card">
              <Sparkles />
              <h3>Built for real life</h3>
              <p>
                Student form preparation, image handling, quick design helpers and more practical
                utilities.
              </p>
            </div>
          </div>
          <div className="about-actions">
            <a className="btn primary" href={REPO} target="_blank" rel="noreferrer">
              Contribute on GitHub <ArrowUpRight size={16} />
            </a>
            <a className="btn secondary" href={DARKI} target="_blank" rel="noreferrer">
              Created by DARKI 🌐
            </a>
          </div>
        </main>
      ) : page === 'not-found' ? (
        <main className="content about-page">
          <span className="eyebrow">404</span>
          <h1>That tool isn't here.</h1>
          <p className="hero-copy">The link may be old or the tool name may be misspelled.</p>
          <button className="btn primary" onClick={goHome}>
            Browse all tools
          </button>
        </main>
      ) : selected && SelectedTool ? (
        <main className="content tool-page">
          <button className="back-link" onClick={goHome} aria-label="Back to all tools">
            <ChevronLeft size={22} /> All tools
          </button>
          <div className="tool-title">
            <span className="tool-icon-large">{SelectedIcon && <SelectedIcon size={26} />}</span>
            <div>
              <span className="eyebrow">{selected.category.toUpperCase()} TOOL</span>
              <h1>{selected.name}</h1>
              <p>{selected.description}</p>
            </div>
          </div>
          <Suspense fallback={<ToolSkeleton />}>
            <SelectedTool />
          </Suspense>
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <div>
              <strong>
                {active === 'remove-bg'
                  ? 'Image sent to remove.bg for processing.'
                  : 'Your files stay on your device.'}
              </strong>
              <span>
                {active === 'remove-bg'
                  ? 'The image is sent through Cloudflare to remove.bg. The API key stays server-side.'
                  : 'Processing happens in your browser. Nothing is sent to a server by this tool.'}
              </span>
            </div>
          </div>
        </main>
      ) : (
        <main className="content">
          <section className="hero">
            <div className="hero-pill">
              <span className="status-dot" /> Free &amp; open source{' '}
              <span className="pill-divider">/</span> Made for everyone
            </div>
            <h1>
              Small tools.
              <br />
              <span className="accent">Big time saved.</span>
            </h1>
            <p className="hero-copy">
              Resize photos for exam forms, make PDFs and QR codes, pick colors and more. No
              sign-up. No uploads.
            </p>
            <div className="hero-actions">
              <button className="btn primary" type="button" onClick={() => open('photo')}>
                Fix a form photo
              </button>
              <button
                className="link-more"
                type="button"
                onClick={() =>
                  document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Browse all tools <ChevronRight size={18} />
              </button>
            </div>
            <div className="search-wrap">
              <div className="search-box">
                <Search size={20} />
                <input
                  ref={searchRef}
                  id="tool-search"
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                  aria-label="Search tools"
                  aria-controls="tool-search-results"
                  aria-expanded={Boolean(focused && query.trim() && results.length)}
                  aria-activedescendant={
                    focused && results[sel] ? `tool-option-${results[sel].id}` : undefined
                  }
                  autoComplete="off"
                  placeholder="Search tools… try “resize photo”"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSel(0)
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 120)}
                  onKeyDown={onSearchKey}
                />
                {query ? (
                  <button
                    className="clear"
                    onClick={() => {
                      setQuery('')
                      searchRef.current?.focus()
                    }}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd>Ctrl / ⌘ K</kbd>
                )}
              </div>
              {focused && query.trim() && (
                <div id="tool-search-results" className="search-results glass" role="listbox">
                  {results.length ? (
                    results.map((t, i) => {
                      const Icon = t.icon
                      return (
                        <button
                          key={t.id}
                          id={`tool-option-${t.id}`}
                          role="option"
                          aria-selected={i === sel}
                          className={i === sel ? 'search-result sel' : 'search-result'}
                          onMouseEnter={() => setSel(i)}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            open(t.id)
                          }}
                        >
                          <span className="ico">
                            <Icon size={18} />
                          </span>
                          <span>
                            <strong>{t.name}</strong>
                            <small>{t.description}</small>
                          </span>
                          <span className="cat">{t.category}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="search-empty" role="status" aria-live="polite">
                      No tools match “{query}”.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="trust-row">
              <span className="trust-badge">
                <LockKeyhole size={14} /> 100% private
              </span>
              <span className="trust-badge">
                <Zap size={14} /> Works in your browser
              </span>
              <span className="trust-badge">
                <Check size={14} /> Free forever
              </span>
              <span className="trust-badge">
                <Sparkles size={14} /> Open source
              </span>
            </div>
            <HeroDemo />
          </section>

          <section className="tools-section" id="tools">
            <div className="section-head">
              <div>
                <span className="eyebrow">THE TOOLKIT</span>
                <h2>What do you need today?</h2>
              </div>
              <span className="tool-count">
                {filtered.length} of {tools.length} tools
              </span>
            </div>
            <CategoryTabs value={category} onChange={setCategory} />
            <div className="tile-grid">
              {filtered.length ? (
                filtered.map((t, i) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tile tile-${tileSize(t.id)}`}
                      data-tool={t.id}
                      style={stagger(i)}
                      onClick={() => open(t.id)}
                      onMouseMove={glow}
                    >
                      <div className="tile-head">
                        <span className="card-icon">
                          <Icon size={22} />
                        </span>
                        {t.tag && <span className="card-tag">{t.tag}</span>}
                      </div>
                      <div className="tile-copy">
                        <span className="tile-eyebrow">{t.category}</span>
                        <h3>{t.name}</h3>
                        <p>{t.description}</p>
                      </div>
                      <div className="tile-art" aria-hidden="true">
                        <TileArt id={t.id} />
                      </div>
                      <span className="tile-go" aria-hidden="true">
                        <ArrowUpRight size={16} />
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="no-results">
                  <CircleHelp size={30} />
                  <strong>No tools found</strong>
                  <span>Try a different search or category.</span>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setQuery('')
                      setCategory('All tools')
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="steps" aria-label="How it works">
            {steps.map((s) => (
              <div className="step" key={s.n}>
                <span className="num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </section>

          <section className="privacy-banner">
            <div className="privacy-banner-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3>Private by default.</h3>
              <p>
                Most file tools run on your device. Background Remover sends images to remove.bg for
                processing.
              </p>
            </div>
            <span className="privacy-check">
              <Check size={16} /> Local by default
            </span>
          </section>
        </main>
      )}
      <Footer onHome={goHome} onAbout={goAbout} />

      <nav className="tabbar glass" aria-label="Primary">
        <button
          type="button"
          className={onHome ? 'tab on' : 'tab'}
          aria-current={onHome ? 'page' : undefined}
          onClick={goHome}
        >
          <Grid2X2 size={22} />
          <span>Tools</span>
        </button>
        <button type="button" className="tab" onClick={focusSearch}>
          <Search size={22} />
          <span>Search</span>
        </button>
        <button
          type="button"
          className={page === 'about' ? 'tab on' : 'tab'}
          aria-current={page === 'about' ? 'page' : undefined}
          onClick={goAbout}
        >
          <Info size={22} />
          <span>About</span>
        </button>
        <a className="tab" href={DARKI} target="_blank" rel="noreferrer">
          <Globe size={22} />
          <span>DARKI</span>
        </a>
      </nav>
    </div>
  )
}
