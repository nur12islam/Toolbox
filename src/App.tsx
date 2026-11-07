import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { BackgroundRemoverTool, CompressPdfTool, MergePdfTool, SignatureTool, UnitConverterTool, WordCounterTool } from './LiveTools'
import {
  ArrowLeft, ArrowUpRight, Check, CircleHelp, Copy, Download, FileImage,
  FileText, Fingerprint, Grid2X2, Image as ImageIcon, LockKeyhole, Menu, Palette,
  QrCode, Search, ShieldCheck, Sparkles, WandSparkles, X, Zap
} from 'lucide-react'

type Tool = { id: string; name: string; description: string; category: string; icon: typeof ImageIcon; tag?: string }
const tools: Tool[] = [
  { id:'photo', name:'Photo & Signature Fixer', description:'Get your photo or signature to the exact size that exam and scholarship forms ask for.', category:'Student', icon:Fingerprint, tag:'Most used' },
  { id:'image', name:'Image Studio', description:'Make any picture smaller in size or dimensions, right on your device.', category:'Image', icon:ImageIcon },
  { id:'pdf', name:'Image to PDF', description:'Turn your photos or scans into one PDF, ready to upload.', category:'PDF', icon:FileText },
  { id:'qr', name:'QR Studio', description:'Make a QR code for a link, a message or contact details.', category:'Generator', icon:QrCode, tag:'Quick' },
  { id:'favicon', name:'Favicon Maker', description:'Make a little website icon from a letter or an emoji.', category:'Design', icon:Sparkles },
  { id:'color', name:'Color Lab', description:'Pick a color and copy its HEX, RGB or HSL code.', category:'Design', icon:Palette },
  { id:'gradient', name:'Gradient Lab', description:'Blend two colors and copy the CSS in one click.', category:'Design', icon:WandSparkles },
  { id:'merge-pdf', name:'Merge PDF', description:'Join several PDF files into a single file.', category:'PDF', icon:FileText },
  { id:'compress-pdf', name:'Compress PDF', description:'Shrink a PDF so it is easier to upload or email.', category:'PDF', icon:FileText },
  { id:'remove-bg', name:'Background Remover', description:'Cut out the background and download a transparent PNG.', category:'Image', icon:ImageIcon },
  { id:'signature', name:'Digital Signature', description:'Draw your signature and save it as a transparent image.', category:'Student', icon:Fingerprint },
  { id:'word-count', name:'Word Counter', description:'Count words and characters, and see the reading time.', category:'Text', icon:FileText },
  { id:'unit', name:'Unit Converter', description:'Convert length, weight and temperature in a tap.', category:'Utilities', icon:Grid2X2 },
]
const categories = ['All tools','Student','Image','PDF','Generator','Design','Text','Utilities']
type Props = { onBack: () => void }
function saveBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
function useImageFile() {
  const [file,setFile] = useState<File|null>(null)
  const [src,setSrc] = useState('')
  useEffect(() => { if (!file) { setSrc(''); return }; const url=URL.createObjectURL(file); setSrc(url); return () => URL.revokeObjectURL(url) },[file])
  return {file,src,setFile}
}
function Upload({ onFiles, multiple=false }: { onFiles:(files:File[])=>void; multiple?:boolean }) {
  const [drag,setDrag]=useState(false)
  return <label className={`dropzone ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);onFiles(Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')))}}><input type="file" accept="image/*" multiple={multiple} onChange={e=>{onFiles(Array.from(e.target.files||[]));e.currentTarget.value=''}} /><span className="upload-icon"><FileImage size={22}/></span><strong>Drop your image{multiple?'s':''} here</strong><span>or <u>browse files</u></span><small>Files stay on this device · No upload</small></label>
}
function PhotoTool() {
  const {file,src,setFile}=useImageFile(); const [w,setW]=useState('413'); const [h,setH]=useState('531'); const [bg,setBg]=useState('#ffffff'); const [format,setFormat]=useState('image/jpeg'); const [quality,setQuality]=useState(0.92); const [message,setMessage]=useState('')
  const exportImage=()=>{if(!src)return;const img=new Image();img.onload=()=>{const width=Math.max(1,Math.min(6000,Number(w)||1)),height=Math.max(1,Math.min(6000,Number(h)||1));const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);const scale=Math.min(width/img.width,height/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,(width-dw)/2,(height-dh)/2,dw,dh);c.toBlob(b=>{if(b){saveBlob(b,`photo-${width}x${height}.${format==='image/png'?'png':'jpg'}`);setMessage('Your resized image is ready.') }},format,quality)};img.src=src}
  return <div className="tool-layout"><div className="tool-controls"><Upload onFiles={f=>{if(f[0]){setFile(f[0]);setMessage('')}}}/>{file&&<p className="file-line"><Check size={15}/>{file.name}</p>}<div className="field-row"><label>Width (px)<input type="number" min="1" max="6000" value={w} onChange={e=>setW(e.target.value)}/></label><label>Height (px)<input type="number" min="1" max="6000" value={h} onChange={e=>setH(e.target.value)}/></label></div><label className="field">Background color<div className="color-input"><input type="color" value={bg} onChange={e=>setBg(e.target.value)}/><code>{bg.toUpperCase()}</code></div></label><label className="field">Export format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label>{format==='image/jpeg'&&<label className="field">Quality · {Math.round(quality*100)}%<input type="range" min=".4" max="1" step=".02" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label>}<button className="btn primary full" disabled={!src} onClick={exportImage}><Download size={17}/> Export resized photo</button>{message&&<p className="success">{message}</p>}<p className="hint">Tip: check the official form's exact size and file-size requirements before submitting.</p></div><div className="preview-panel"><div className="preview-heading"><span>Preview</span><span className="muted">{src?file?.name:'Your image appears here'}</span></div>{src?<img className="image-preview" src={src} alt="Selected image preview"/>:<div className="empty-preview"><ImageIcon size={34}/><span>Upload a photo to preview it</span></div>}<p className="hint">The export fits your image proportionally inside the requested dimensions. It does not automatically remove backgrounds.</p></div></div>
}
function ImageTool() {
  const {file,src,setFile}=useImageFile();const [w,setW]=useState('1280');const [h,setH]=useState('1280');const [quality,setQuality]=useState(.82);const [format,setFormat]=useState('image/jpeg');const [keep,setKeep]=useState(true)
  const process=()=>{if(!src)return;const img=new Image();img.onload=()=>{let width=Math.max(1,Number(w)||img.width),height=Math.max(1,Number(h)||img.height);if(keep){const ratio=Math.min(width/img.width,height/img.height);width=Math.round(img.width*ratio);height=Math.round(img.height*ratio)}const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d')!.drawImage(img,0,0,width,height);c.toBlob(b=>b&&saveBlob(b,`toolbox-${width}x${height}.${format==='image/png'?'png':'jpg'}`),format,quality)};img.src=src}
  return <div className="tool-layout"><div className="tool-controls"><Upload onFiles={f=>f[0]&&setFile(f[0])}/>{file&&<p className="file-line"><Check size={15}/>{file.name} · {(file.size/1024).toFixed(0)} KB</p>}<div className="field-row"><label>Max width<input type="number" value={w} onChange={e=>setW(e.target.value)}/></label><label>Max height<input type="number" value={h} onChange={e=>setH(e.target.value)}/></label></div><label className="check-line"><input type="checkbox" checked={keep} onChange={e=>setKeep(e.target.checked)}/> Keep aspect ratio</label><label className="field">Output format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="image/jpeg">JPEG — smaller files</option><option value="image/png">PNG — lossless</option></select></label>{format==='image/jpeg'&&<label className="field">Quality · {Math.round(quality*100)}%<input type="range" min=".2" max="1" step=".05" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label>}<button className="btn primary full" disabled={!src} onClick={process}><Download size={17}/> Resize & export</button></div><div className="preview-panel"><div className="preview-heading"><span>Original preview</span><span className="muted">{file? `${(file.size/1024).toFixed(1)} KB`:''}</span></div>{src?<img className="image-preview" src={src} alt="Original image"/>:<div className="empty-preview"><ImageIcon size={34}/><span>Choose an image to get started</span></div>}</div></div>
}
function PdfTool() {
 const [files,setFiles]=useState<File[]>([]);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('')
 const create=async()=>{if(!files.length)return;setBusy(true);setMsg('');try{const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});for(let i=0;i<files.length;i++){const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(files[i])});const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Could not read image'));img.src=data});if(i)pdf.addPage();const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),scale=Math.min(pw/img.width,ph/img.height);pdf.addImage(data,files[i].type==='image/png'?'PNG':'JPEG',(pw-img.width*scale)/2,(ph-img.height*scale)/2,img.width*scale,img.height*scale)}pdf.save('toolbox-images.pdf');setMsg('PDF created and downloaded.')}catch{setMsg('Could not convert one of those files. Try JPG or PNG images.')}finally{setBusy(false)}}
 return <div className="single-tool"><Upload multiple onFiles={f=>{setFiles(f);setMsg('')}}/><p className="hint">Each selected image becomes one page, fitted to A4 paper. Select images in the order you want them.</p>{files.length>0&&<div className="file-list">{files.map((f,i)=><div className="file-list-item" key={f.name+i}><FileImage size={18}/><span>{i+1}. {f.name}</span><small>{(f.size/1024).toFixed(0)} KB</small></div>)}</div>}<button className="btn primary" disabled={!files.length||busy} onClick={create}><Download size={17}/>{busy?'Creating PDF…':`Create PDF · ${files.length} image${files.length===1?'':'s'}`}</button>{msg&&<p className="success">{msg}</p>}</div>
}
function QrTool() {
 const [value,setValue]=useState('https://example.com');const [size,setSize]=useState('512');const [dark,setDark]=useState('#2a0a10');const [light,setLight]=useState('#ffffff');const [data,setData]=useState('');const [error,setError]=useState('')
 useEffect(()=>{let active=true;QRCode.toDataURL(value||' ',{width:Number(size),margin:2,color:{dark:dark+'ff',light:light+'ff'}}).then(url=>{if(active){setData(url);setError('')}}).catch(()=>active&&setError('Could not generate QR code'));return()=>{active=false}},[value,size,dark,light])
 return <div className="tool-layout"><div className="tool-controls"><label className="field">Text or URL<textarea rows={4} value={value} onChange={e=>setValue(e.target.value)} placeholder="Paste a URL or type a message"/></label><label className="field">Image size<select value={size} onChange={e=>setSize(e.target.value)}><option value="256">256 × 256</option><option value="512">512 × 512</option><option value="1024">1024 × 1024</option></select></label><div className="field-row"><label>QR color<div className="color-input"><input type="color" value={dark} onChange={e=>setDark(e.target.value)}/><code>{dark}</code></div></label><label>Background<div className="color-input"><input type="color" value={light} onChange={e=>setLight(e.target.value)}/><code>{light}</code></div></label></div><button className="btn primary full" disabled={!data} onClick={()=>{const a=document.createElement('a');a.href=data;a.download='toolbox-qr.png';a.click()}}><Download size={17}/> Download QR PNG</button><p className="hint">Test your QR code with a phone before printing or sharing it.</p></div><div className="qr-preview">{data?<img src={data} alt="Generated QR code"/>:<span>{error||'Preparing QR code…'}</span>}<strong>Live preview</strong><small>Generated locally in your browser</small></div></div>
}
function FaviconTool(){const [text,setText]=useState('T');const [bg,setBg]=useState('#dc143c');const [fg,setFg]=useState('#ffffff');const [shape,setShape]=useState('rounded');const canvas=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=canvas.current;if(!c)return;const ctx=c.getContext('2d')!;c.width=256;c.height=256;ctx.clearRect(0,0,256,256);ctx.fillStyle=bg;if(shape==='circle'){ctx.beginPath();ctx.arc(128,128,120,0,Math.PI*2);ctx.fill()}else if(shape==='rounded'){ctx.beginPath();ctx.roundRect(8,8,240,240,48);ctx.fill()}else ctx.fillRect(0,0,256,256);ctx.fillStyle=fg;ctx.font='bold 144px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((text||'T').slice(0,2),128,134)},[text,bg,fg,shape]);return <div className="tool-layout"><div className="tool-controls"><label className="field">Letter or emoji<input maxLength={2} value={text} onChange={e=>setText(e.target.value)} placeholder="T"/></label><div className="field-row"><label>Background<div className="color-input"><input type="color" value={bg} onChange={e=>setBg(e.target.value)}/><code>{bg}</code></div></label><label>Foreground<div className="color-input"><input type="color" value={fg} onChange={e=>setFg(e.target.value)}/><code>{fg}</code></div></label></div><label className="field">Shape<select value={shape} onChange={e=>setShape(e.target.value)}><option value="rounded">Rounded square</option><option value="circle">Circle</option><option value="square">Square</option></select></label><button className="btn primary full" onClick={()=>canvas.current?.toBlob(b=>b&&saveBlob(b,'favicon.png'))}><Download size={17}/> Download 256px PNG</button><p className="hint">For browser compatibility, convert the PNG to .ico if your site requires that format.</p></div><div className="qr-preview"><canvas ref={canvas} className="favicon-canvas"/><strong>Favicon preview</strong><small>256 × 256 PNG</small></div></div>}
function ColorTool(){const [color,setColor]=useState('#DC143C');const values=useMemo(()=>{const n=parseInt(color.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;const rr=r/255,gg=g/255,bb=b/255,max=Math.max(rr,gg,bb),min=Math.min(rr,gg,bb),d=max-min;let h=0,s=0,l=(max+min)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(max){case rr:h=((gg-bb)/d+(gg<bb?6:0))/6;break;case gg:h=((bb-rr)/d+2)/6;break;default:h=((rr-gg)/d+4)/6}}return {hex:color.toUpperCase(),rgb:`rgb(${r}, ${g}, ${b})`,hsl:`hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`}},[color]);return <div className="color-lab"><div className="big-swatch" style={{background:color}}/><label className="field">Choose a color<div className="color-input wide"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code></div></label>{Object.entries(values).map(([k,v])=><div className="copy-row" key={k}><div><small>{k.toUpperCase()}</small><code>{v}</code></div><button className="icon-btn" aria-label={`Copy ${k}`} onClick={()=>navigator.clipboard.writeText(v)}><Copy size={16}/></button></div>)}</div>}
function GradientTool(){const [a,setA]=useState('#dc143c');const [b,setB]=useState('#3b2218');const [angle,setAngle]=useState(135);const css=`linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`;return <div className="gradient-lab"><div className="gradient-preview" style={{background:css}}/><div className="field-row"><label>Start color<div className="color-input"><input type="color" value={a} onChange={e=>setA(e.target.value)}/><code>{a}</code></div></label><label>End color<div className="color-input"><input type="color" value={b} onChange={e=>setB(e.target.value)}/><code>{b}</code></div></label></div><label className="field">Angle · {angle}°<input type="range" min="0" max="360" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label><div className="copy-row"><div><small>CSS BACKGROUND</small><code>{css}</code></div><button className="icon-btn" aria-label="Copy CSS" onClick={()=>navigator.clipboard.writeText(`background: ${css};`)}><Copy size={16}/></button></div></div>}
const REPO = 'https://github.com/nur12islam/Toolbox'
const DARKI = 'https://me.darki.online'
const steps = [
  { n: 1, title: 'Pick a tool', text: 'Search or browse the cards. Every tool says exactly what it does.' },
  { n: 2, title: 'Add your file', text: 'Drag it in or tap to choose it. It never leaves your device.' },
  { n: 3, title: 'Download the result', text: 'Tweak the options, preview it live, then save it in one click.' },
]

function Footer({ onHome, onAbout }: { onHome: () => void; onAbout: () => void }) {
  return <footer className="footer">
    <div className="footer-grid">
      <div>
        <button className="brand" onClick={onHome} aria-label="ToolBox Online home"><span className="brand-mark"><Grid2X2 size={18}/></span><span>ToolBox<span className="brand-light"> Online</span></span></button>
        <p className="tag">Free tools for students and creators. Simple, fast and private. Everything runs in your browser.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <div className="footer-links"><button onClick={onHome}>All tools</button><button onClick={onAbout}>About</button><a href={REPO} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13}/></a></div>
      </div>
      <div>
        <h4>Project</h4>
        <div className="footer-links"><a href={`${REPO}/issues`} target="_blank" rel="noreferrer">Report an issue</a><a href={REPO} target="_blank" rel="noreferrer">Contribute</a><a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">MIT License</a></div>
      </div>
    </div>
    <div className="footer-credit glass"><span>Created by</span><a href={DARKI} target="_blank" rel="noreferrer">DARKI 🌐 me.darki.online <ArrowUpRight size={14}/></a></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} ToolBox Online · Open source</span><span>Useful by design. Private by default.</span></div>
  </footer>
}

export default function App(){
  const [active,setActive]=useState('');const [query,setQuery]=useState('');const [category,setCategory]=useState('All tools');const [mobileNav,setMobileNav]=useState(false);const [page,setPage]=useState('tools')
  const [focused,setFocused]=useState(false);const [sel,setSel]=useState(0)
  const searchRef=useRef<HTMLInputElement>(null)
  const selected=tools.find(t=>t.id===active); const SelectedIcon=selected?.icon
  const match=(t:Tool)=>`${t.name} ${t.description} ${t.category}`.toLowerCase().includes(query.trim().toLowerCase())
  const filtered=tools.filter(t=>(category==='All tools'||t.category===category)&&match(t))
  const results=query.trim()?tools.filter(match).slice(0,6):[]
  const open=(id:string)=>{setActive(id);setPage('tools');setMobileNav(false);setQuery('');setFocused(false);window.scrollTo({top:0,behavior:'smooth'})}
  const goHome=()=>{setActive('');setPage('tools');setQuery('');setMobileNav(false);window.scrollTo({top:0,behavior:'smooth'})}
  const goAbout=()=>{setPage('about');setActive('');setMobileNav(false);window.scrollTo({top:0})}
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setActive('');setPage('tools');setTimeout(()=>{searchRef.current?.focus();searchRef.current?.select()},60)}
    }
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)
  },[])
  useEffect(()=>setSel(0),[query])
  const onSearchKey=(e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key==='ArrowDown'){e.preventDefault();setSel(s=>Math.min(s+1,Math.max(results.length-1,0)))}
    else if(e.key==='ArrowUp'){e.preventDefault();setSel(s=>Math.max(s-1,0))}
    else if(e.key==='Enter'&&results[sel]){open(results[sel].id)}
    else if(e.key==='Escape'){setFocused(false);searchRef.current?.blur()}
  }
  const glow=(e:React.MouseEvent<HTMLButtonElement>)=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mx',`${e.clientX-r.left}px`)}
  const showFeatured=!query.trim()&&(category==='All tools'||category==='Student')
  return <div className="app-shell">
    <header className="topbar glass">
      <button className="brand" onClick={goHome} aria-label="ToolBox Online home"><span className="brand-mark"><Grid2X2 size={19}/></span><span>ToolBox<span className="brand-light"> Online</span></span></button>
      <nav className={mobileNav?'nav open':'nav'} aria-label="Main">
        <button className={page==='tools'?'nav-link active':'nav-link'} onClick={goHome}>All tools</button>
        <button className={page==='about'?'nav-link active':'nav-link'} onClick={goAbout}>About</button>
        <a className="nav-link" href={REPO} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14}/></a>
        <a className="nav-credit" href={DARKI} target="_blank" rel="noreferrer">By DARKI 🌐</a>
      </nav>
      <button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle menu" aria-expanded={mobileNav}>{mobileNav?<X size={18}/>:<Menu size={18}/>}</button>
    </header>

    {page==='about'?<main className="content about-page">
      <span className="eyebrow">THE IDEA</span>
      <h1>Useful tools.<br/><span className="accent">Less friction.</span></h1>
      <p className="hero-copy">ToolBox Online is a community-built collection of small, practical utilities for students and creators. No sign-ups, no clutter. Most file tools run right in your browser.</p>
      <div className="about-grid">
        <div className="feature-card"><ShieldCheck/><h3>Privacy-first</h3><p>Most tools process files locally. Background Remover sends images to remove.bg for processing.</p></div>
        <div className="feature-card"><LockKeyhole/><h3>Free &amp; open source</h3><p>Inspect the code, report issues, suggest ideas, or contribute improvements on GitHub.</p></div>
        <div className="feature-card"><Sparkles/><h3>Built for real life</h3><p>Student form preparation, image handling, quick design helpers and more practical utilities.</p></div>
      </div>
      <div className="about-actions">
        <a className="btn primary" href={REPO} target="_blank" rel="noreferrer">Contribute on GitHub <ArrowUpRight size={16}/></a>
        <a className="btn secondary" href={DARKI} target="_blank" rel="noreferrer">Created by DARKI 🌐</a>
      </div>
    </main>

    :selected?<main className="content tool-page">
      <button className="back-link" onClick={goHome}><ArrowLeft size={16}/> Back to all tools</button>
      <div className="tool-title"><span className="tool-icon-large">{SelectedIcon&&<SelectedIcon size={26}/>}</span><div><span className="eyebrow">{selected.category.toUpperCase()} TOOL</span><h1>{selected.name}</h1><p>{selected.description}</p></div></div>
      {active==='photo'?<PhotoTool/>:active==='image'?<ImageTool/>:active==='pdf'?<PdfTool/>:active==='qr'?<QrTool/>:active==='favicon'?<FaviconTool/>:active==='color'?<ColorTool/>:active==='gradient'?<GradientTool/>:active==='merge-pdf'?<MergePdfTool/>:active==='compress-pdf'?<CompressPdfTool/>:active==='remove-bg'?<BackgroundRemoverTool/>:active==='signature'?<SignatureTool/>:active==='word-count'?<WordCounterTool/>:<UnitConverterTool/>}
      <div className="privacy-note"><ShieldCheck size={18}/><div><strong>{active==='remove-bg'?'Image sent to remove.bg for processing.':'Your files stay on your device.'}</strong><span>{active==='remove-bg'?'The image is sent through Cloudflare to remove.bg. The API key stays server-side.':'Processing happens in your browser. Nothing is sent to a server by this tool.'}</span></div></div>
    </main>

    :<main className="content">
      <section className="hero">
        <div className="hero-pill"><span className="status-dot"/> Free &amp; open source <span className="pill-divider">/</span> Made for everyone</div>
        <h1>Small tools.<br/><span className="accent">Big time saved.</span></h1>
        <p className="hero-copy">Resize photos for exam forms, make PDFs and QR codes, pick colors and more. No sign-up. No uploads.</p>
        <div className="search-wrap">
          <div className="search-box">
            <Search size={20}/>
            <input ref={searchRef} id="tool-search" aria-label="Search tools" autoComplete="off" placeholder="Search tools… try “resize photo” or “QR”" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),120)} onKeyDown={onSearchKey}/>
            {query?<button className="clear" onClick={()=>{setQuery('');searchRef.current?.focus()}} aria-label="Clear search"><X size={14}/></button>:<kbd>Ctrl / ⌘ K</kbd>}
          </div>
          {focused&&query.trim()&&<div className="search-results glass" role="listbox">
            {results.length?results.map((t,i)=>{const Icon=t.icon;return <button key={t.id} role="option" aria-selected={i===sel} className={i===sel?'search-result sel':'search-result'} onMouseEnter={()=>setSel(i)} onMouseDown={e=>{e.preventDefault();open(t.id)}}><span className="ico"><Icon size={18}/></span><span><strong>{t.name}</strong><small>{t.description}</small></span><span className="cat">{t.category}</span></button>}):<div className="search-empty">No tools match “{query}”.</div>}
          </div>}
        </div>
        <div className="trust-row">
          <span className="trust-badge"><LockKeyhole size={14}/> 100% private</span>
          <span className="trust-badge"><Zap size={14}/> Works in your browser</span>
          <span className="trust-badge"><Check size={14}/> Free forever</span>
          <span className="trust-badge"><Sparkles size={14}/> Open source</span>
        </div>
      </section>

      <section className="tools-section" id="tools">
        <div className="section-head"><div><span className="eyebrow">THE TOOLKIT</span><h2>What do you need today?</h2></div><span className="tool-count">{filtered.length} of {tools.length} tools</span></div>
        <div className="category-list" role="tablist">{categories.map(c=><button key={c} role="tab" aria-selected={category===c} className={category===c?'category active':'category'} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        {filtered.length?<div className="tool-grid">{filtered.map((t,i)=>{
          const Icon=t.icon;const featured=showFeatured&&t.id==='photo'
          return <button key={t.id} className={`tool-card${featured?' featured':''}${i%4===3?' alt':''}`} onClick={()=>open(t.id)} onMouseMove={glow}>
            <div className="feat-body">
              <div className="card-top"><span className="card-icon"><Icon size={22}/></span>{t.tag?<span className="card-tag">{t.tag}</span>:<ArrowUpRight size={18} className="card-arrow"/>}</div>
              <h3>{t.name}</h3><p>{t.description}</p>
              <div className="card-bottom"><span>{t.category}</span><span>Open tool <ArrowUpRight size={13}/></span></div>
            </div>
            {featured&&<div className="feat-art" aria-hidden="true"><div className="frame"/><span className="kb">200×230 · 50 KB</span></div>}
          </button>})}</div>
        :<div className="tool-grid"><div className="no-results"><CircleHelp size={30}/><strong>No tools found</strong><span>Try a different search or category.</span><button className="btn secondary" onClick={()=>{setQuery('');setCategory('All tools')}}>Clear filters</button></div></div>}
      </section>

      <section className="steps" aria-label="How it works">{steps.map(s=><div className="step" key={s.n}><span className="num">{s.n}</span><h3>{s.title}</h3><p>{s.text}</p></div>)}</section>

      <section className="privacy-banner"><div className="privacy-banner-icon"><ShieldCheck size={24}/></div><div><h3>Private by default.</h3><p>Most file tools run on your device. Background Remover sends images to remove.bg for processing.</p></div><span className="privacy-check"><Check size={16}/> Local by default</span></section>
    </main>}
    <Footer onHome={goHome} onAbout={goAbout}/>
  </div>
}
