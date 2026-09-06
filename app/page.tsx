'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  RotateCcw,
  Camera,
  Layers3,
  Focus,
  X,
  Play,
  Pause,
  Plus,
  Minus,
  Smartphone,
  Info,
  ChevronRight,
  ChevronLeft,
  Tag,
  Maximize2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useExploreTool } from './agent-tools';
import Scene from './scene';
import { parts, journey, sources } from './parts';

export default function Home() {
  const [explode, setExplode] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [isolated, setIsolated] = useState(false),
    [color, setColor] = useState('silver'),
    [rotate, setRotate] = useState(false),
    [view, setView] = useState(0),
    [zoom, setZoom] = useState(0),
    [step, setStep] = useState(-1),
    [playing, setPlaying] = useState(false),
    [about, setAbout] = useState(false),
    [panel, setPanel] = useState(false),
    [labels, setLabels] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const studio = useRef<HTMLElement>(null),
    part = parts.find((p) => p.id === selected);
  const stop = () => {
    setPlaying(false);
    setStep(-1);
  };
  const reset = () => {
    stop();
    setExplode(0);
    setSelected(null);
    setIsolated(false);
    setRotate(false);
    setZoom(0);
    setView((v) => (v % 2 === 0 ? v + 2 : v + 1));
  };
  const select = (id: string) => {
    stop();
    setSelected(id);
    setIsolated(true);
    setRotate(false);
    setExplode(100);
    setZoom(0);
    setPanel(false);
  };
  function goStep(n: number) {
    setStep(n);
    setSelected(journey[n].part);
    setIsolated(n < 4);
    setExplode(n < 4 ? 100 : 0);
    setRotate(false);
    setZoom(0);
  }
  function photo() {
    setPanel(false);
    goStep(0);
    setPlaying(true);
  }
  function overview() {
    stop();
    setSelected(null);
    setIsolated(false);
    setExplode(78);
    setZoom(0);
    setView((v) => (v % 2 === 0 ? v + 2 : v + 1));
  }
  useEffect(() => {
    if (!playing || step < 0) return;
    const timer = setTimeout(
      () => {
        if (step === 4) setPlaying(false);
        else goStep(step + 1);
      },
      step === 4 ? 6000 : 5500,
    );
    return () => clearTimeout(timer);
  }, [playing, step]);
  useExploreTool(
    (i) => {
      stop();
      if (i.assembly) setSelected(i.assembly);
      else setSelected(null);
      setIsolated(i.isolate ?? false);
      setZoom(0);
      if (i.explode !== undefined) setExplode(i.explode);
      else if (i.assembly) setExplode(78);
    },
    parts.map((p) => p.id),
  );
  const phase =
    explode < 1
      ? 'Assembled'
      : explode <= 25
        ? 'Open the enclosure'
        : explode <= 56
          ? 'Reveal the systems'
          : explode <= 84
            ? 'Explore the assemblies'
            : 'Inspect every layer';
  return (
    <main
      ref={studio}
      className={
        'studio ' +
        (isolated ? 'inspecting ' : '') +
        (step >= 0 ? 'touring' : '')
      }
    >
      <header className="topbar">
        <a href="/" className="brand" aria-label="Inside iPhone home">
          inside <span>/</span> iPhone
        </a>
        <button className="source-button" onClick={() => setAbout(true)}>
          About this study <ArrowUpRight size={14} />
        </button>
      </header>
      <div className="product-heading">
        <div className="eyebrow">AN INTERACTIVE OBJECT STUDY</div>
        <h1>
          iPhone 17 Pro<span>17 assemblies. A closer perspective.</span>
        </h1>
      </div>
      <div className="finish" role="group" aria-label="Phone finish">
        <span>
          {color === 'silver'
            ? 'Silver'
            : color === 'orange'
              ? 'Cosmic Orange'
              : 'Deep Blue'}
        </span>
        {[
          ['silver', '#bcc2ca'],
          ['orange', '#be733e'],
          ['blue', '#344b66'],
        ].map(([c, hex]) => (
          <button
            key={c}
            className={'swatch ' + (color === c ? 'active' : '')}
            style={{ background: hex }}
            aria-label={
              c === 'silver'
                ? 'Silver'
                : c === 'orange'
                  ? 'Cosmic Orange'
                  : 'Deep Blue'
            }
            aria-pressed={color === c}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <section className="scene-wrap" aria-label="Interactive iPhone studio">
        <Scene
          explode={explode / 100}
          selected={selected}
          isolated={isolated}
          color={color}
          rotating={rotate}
          view={view}
          zoom={zoom}
          step={step}
          playing={playing}
          labels={labels}
          onSelect={select}
          onReady={() => setReady(true)}
          onError={setError}
        />
        {!ready && !error && (
          <div className="loading" role="status">
            Preparing the studio
            <span />
          </div>
        )}
        {error && (
          <div className="loading error" role="alert">
            {error}
            <button onClick={() => location.reload()}>Reload studio</button>
          </div>
        )}
      </section>
      <nav className="right-tools" aria-label="View controls">
        <button
          onClick={() => {
            stop();
            setView((v) => v + 1);
          }}
          aria-label="Flip phone"
          title="Flip phone"
        >
          <Smartphone size={19} />
        </button>
        <button
          onClick={() => setRotate(!rotate)}
          aria-label={rotate ? 'Pause rotation' : 'Auto rotate'}
          title="Auto rotate"
          aria-pressed={rotate}
        >
          {rotate ? <Pause size={18} /> : <RotateCcw size={18} />}
        </button>
        <span />
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 1))}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus size={19} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(-2, z - 1))}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={19} />
        </button>
        <button
          onClick={() => setLabels(!labels)}
          aria-label="Show component labels"
          title="Component labels"
          aria-pressed={labels}
        >
          <Tag size={17} />
        </button>
        <span />
        <button onClick={reset} aria-label="Reset view" title="Reset view">
          <Focus size={19} />
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else studio.current?.requestFullscreen?.();
          }}
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          <Maximize2 size={17} />
        </button>
      </nav>
      {panel && (
        <aside className="parts-panel" aria-label="Assemblies">
          <div className="panel-title">
            <span>
              Assemblies <small>17</small>
            </span>
            <button
              onClick={() => setPanel(false)}
              aria-label="Close assemblies"
            >
              <X size={17} />
            </button>
          </div>
          <div className="parts-list">
            {parts.map((p, i) => (
              <button
                className={'part-row ' + (p.id === selected ? 'selected' : '')}
                key={p.id}
                onClick={() => select(p.id)}
              >
                <span className="part-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{p.name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <p>Choose an assembly for a macro view.</p>
        </aside>
      )}
      {part && step < 0 && (
        <aside className="inspector">
          <div className="inspector-top">
            <span>{part.category}</span>
            <button aria-label="Close component details" onClick={overview}>
              <X size={17} />
            </button>
          </div>
          <span className="detail-number">
            {String(parts.indexOf(part) + 1).padStart(2, '0')} / 17
          </span>
          <h2>{part.name}</h2>
          <div className="detail-rule" />
          <p>{part.description}</p>
          <dl>
            <dt>FUNCTION</dt>
            <dd>{part.role}</dd>
          </dl>
          <button
            className="outline-button"
            onClick={() => setIsolated(!isolated)}
          >
            <Focus size={16} />
            {isolated ? 'View in context' : 'Macro view'}
          </button>
          <button className="text-button" onClick={overview}>
            All assemblies <ArrowUpRight size={15} />
          </button>
          <small>Reference-informed, illustrative geometry</small>
        </aside>
      )}
      {step >= 0 && (
        <aside className="journey-card" aria-live="polite">
          <div className="inspector-top">
            <span>INSIDE A PHOTOGRAPH</span>
            <button onClick={overview} aria-label="Close photo journey">
              <X size={17} />
            </button>
          </div>
          <div className="journey-progress">
            {journey.map((s, i) => (
              <button
                key={i}
                className={i <= step ? 'passed' : ''}
                onClick={() => {
                  setPlaying(false);
                  goStep(i);
                }}
                aria-label={'Photo journey step ' + (i + 1)}
                aria-current={step === i ? 'step' : undefined}
              />
            ))}
          </div>
          <span className="journey-label">{journey[step].label}</span>
          <h2>{journey[step].title}</h2>
          <p>{journey[step].description}</p>
          <div className="tour-controls">
            <button
              aria-label="Previous photo step"
              disabled={step === 0}
              onClick={() => {
                setPlaying(false);
                goStep(step - 1);
              }}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              onClick={() => {
                if (step === 4) {
                  goStep(0);
                  setPlaying(true);
                } else setPlaying(!playing);
              }}
              aria-label={
                playing
                  ? 'Pause photo journey'
                  : step === 4
                    ? 'Replay photo journey'
                    : 'Play photo journey'
              }
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              <span>{playing ? 'Pause' : step === 4 ? 'Replay' : 'Play'}</span>
            </button>
            <button
              aria-label="Next photo step"
              disabled={step === 4}
              onClick={() => {
                setPlaying(false);
                goStep(step + 1);
              }}
            >
              <ChevronRight size={19} />
            </button>
          </div>
          <small>Optics and processing are simplified illustrations.</small>
        </aside>
      )}
      <div className="viewport-hint">
        {isolated ? 'MACRO STUDY' : 'DRAG TO ORBIT'} <span>·</span> Scroll to
        zoom
      </div>
      <section className="control-dock" aria-label="Assembly controls">
        <button
          className={'assembly-toggle ' + (panel ? 'active' : '')}
          onClick={() => setPanel(!panel)}
          aria-expanded={panel}
        >
          <Layers3 size={20} />
          <span>Assemblies</span>
          <small>17</small>
        </button>
        <div className="explode-control">
          <div className="slider-heading">
            <span>{isolated ? 'Component detail' : phase}</span>
            <output>
              {Math.round(explode)}
              <small>%</small>
            </output>
          </div>
          <Slider
            aria-label="Explode phone assemblies"
            value={[explode]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => {
              stop();
              setIsolated(false);
              setSelected(null);
              setExplode(Array.isArray(v) ? v[0] : v);
            }}
          />
          <div className="slider-captions">
            {[
              [0, 'Assemble'],
              [25, 'Open'],
              [56, 'Systems'],
              [84, 'Explore'],
              [100, 'Detail'],
            ].map(([n, t]) => (
              <button
                key={n}
                onClick={() => {
                  stop();
                  setIsolated(false);
                  setSelected(null);
                  setExplode(n as number);
                  setZoom(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button className="photo-button" onClick={photo}>
          <Camera size={19} />
          <span>Inside a photograph</span>
          <Play size={12} fill="currentColor" />
        </button>
      </section>
      <footer>
        <span>
          REAL-TIME 3D <b>/</b> BUILT WITH ASTRA
        </span>
        <button onClick={() => setAbout(true)}>
          Independent study · Illustrative internals <Info size={12} />
        </button>
      </footer>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="about-modal" showCloseButton={false}>
          <button
            className="modal-close"
            onClick={() => setAbout(false)}
            aria-label="Close about"
          >
            <X size={20} />
          </button>
          <div className="eyebrow">ABOUT THE OBJECT</div>
          <DialogTitle>A closer perspective.</DialogTitle>
          <DialogDescription>
            An independent interactive study of iPhone 17 Pro. Exterior
            proportions reference Apple's published dimensions. Internal
            assemblies reference Apple's component diagram and teardown
            photography, with simplified shapes, optics and connections.
          </DialogDescription>
          <p>
            This is an educational visualization, not an exact device scan,
            service parts catalogue or repair guide. The 17 assemblies organize
            modeled geometry; they are not a claim about the phone's total part
            count.
          </p>
          <div className="source-links">
            {sources.map(([url, label]) => (
              <a href={url} key={url} target="_blank" rel="noreferrer">
                {label}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
          <small>
            iPhone and the Apple logo are trademarks of Apple Inc. This project
            is not affiliated with or endorsed by Apple.
          </small>
          <button className="outline-button" onClick={() => setAbout(false)}>
            Back to the studio
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
