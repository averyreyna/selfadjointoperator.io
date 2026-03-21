import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import * as d3 from 'd3';
import ViewModeToggle from '../components/ViewModeToggle';
import styles from './EntryGraphView.module.css';

const BOTTOM_PAD = 120;
const COLLISION_R = 58;
/** Sync ticks before async d3-timer so first paint has positions (Strict Mode can stop the sim before rAF). */
const PREWARM_TICKS = 160;

function edgeKey(link) {
  const s = link.source;
  const t = link.target;
  const sid = typeof s === 'object' && s ? s.id : s;
  const tid = typeof t === 'object' && t ? t.id : t;
  return `${sid}::${tid}`;
}

function straightEdgePath(link) {
  const s = link.source;
  const t = link.target;
  if (typeof s === 'string' || typeof t === 'string') return '';
  const x1 = s.x;
  const y1 = s.y;
  const x2 = t.x;
  const y2 = t.y;
  return `M${x1},${y1}L${x2},${y2}`;
}

function EntryGraphView({ nodes, edges, introName, mode, onChangeMode }) {
  const canvasRef = useRef(null);
  const graphSurfaceRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const simulationRef = useRef(null);
  const transformRef = useRef(d3.zoomIdentity);
  const nodeElRefs = useRef({});

  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [simNodes, setSimNodes] = useState([]);
  const [simLinks, setSimLinks] = useState([]);
  const [transform, setTransform] = useState(() => d3.zoomIdentity);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0) setCanvasWidth(w);
      if (h > 0) setCanvasHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const graphWidth = Math.max(canvasWidth, 400);
  /** Layout height must match the visible canvas so forces center the graph in view (not mid‑air in a multi‑k‑px tall sheet). */
  const graphHeight = useMemo(() => {
    const viewportH = Math.max(280, canvasHeight || Math.floor(window.innerHeight * 0.42));
    if (!simNodes.length) {
      return Math.max(viewportH, 360);
    }
    const ys = simNodes.map((n) => n.y);
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    const span = maxY - minY;
    return Math.max(viewportH, span + BOTTOM_PAD + 120, maxY + BOTTOM_PAD + 80);
  }, [simNodes, canvasHeight]);

  useEffect(() => {
    if (!nodes.length) {
      setSimNodes([]);
      setSimLinks([]);
      return;
    }

    const gw = Math.max(canvasWidth, 400);
    const gh =
      canvasHeight > 0
        ? Math.max(280, canvasHeight)
        : Math.max(360, Math.floor(window.innerHeight * 0.42));

    const simNodeObjs = nodes.map((n, i) => ({
      ...n,
      x: gw / 2 + Math.sin(i * 0.85) * 52 + (Math.random() - 0.5) * 34,
      y:
        72
        + ((i + 0.5) / Math.max(nodes.length, 1)) * Math.max(gh - 144, 120)
        + (Math.random() - 0.5) * 22
    }));

    const linkObjs = edges.map((e) => ({
      source: e.source,
      target: e.target
    }));

    const simulation = d3
      .forceSimulation(simNodeObjs)
      .force(
        'link',
        d3
          .forceLink(linkObjs)
          .id((d) => d.id)
          .distance(92)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(gw / 2, gh / 2))
      .force('collide', d3.forceCollide(COLLISION_R))
      .force('y', d3.forceY(gh / 2).strength(0.07))
      .force('x', d3.forceX(gw / 2).strength(0.03));

    simulationRef.current = simulation;

    let firstTick = true;
    const applyTick = () => {
      setSimNodes([...simNodeObjs]);
      setSimLinks([...linkObjs]);
      if (firstTick) {
        firstTick = false;
        setLayoutVersion((v) => v + 1);
      }
    };

    if (reducedMotion) {
      while (simulation.alpha() > 0.02) {
        simulation.tick();
      }
      simulation.stop();
      applyTick();
    } else {
      for (let i = 0; i < PREWARM_TICKS; i += 1) {
        simulation.tick();
      }
      applyTick();
      simulation.on('tick', applyTick);
    }

    return () => {
      simulation.stop();
      simulation.on('tick', null);
      simulationRef.current = null;
    };
  }, [nodes, edges, canvasWidth, canvasHeight, reducedMotion]);

  useEffect(() => {
    const el = graphSurfaceRef.current;
    if (!el || !simNodes.length) return;

    const zoomFn = d3
      .zoom()
      .scaleExtent([0.35, 2.6])
      .filter((event) => {
        if (event.target.closest?.('button')) {
          return event.type === 'wheel';
        }
        return !event.button;
      })
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    d3.select(el).call(zoomFn);

    return () => {
      d3.select(el).on('.zoom', null);
    };
  }, [simNodes.length]);

  useLayoutEffect(() => {
    const sim = simulationRef.current;
    const zoomLayer = zoomLayerRef.current;
    if (!sim || !zoomLayer || layoutVersion === 0) return;

    const dragBehavior = d3
      .drag()
      .subject((event, d) => d)
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.35).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        const t = transformRef.current;
        const [gx, gy] = t.invert(d3.pointer(event, zoomLayer));
        d.fx = gx;
        d.fy = gy;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const refsAtAttach = { ...nodeElRefs.current };

    sim.nodes().forEach((node) => {
      const el = refsAtAttach[node.id];
      if (el) d3.select(el).datum(node).call(dragBehavior);
    });

    return () => {
      sim.nodes().forEach((node) => {
        const el = refsAtAttach[node.id];
        if (el) d3.select(el).on('.drag', null);
      });
    };
  }, [layoutVersion]);

  const nodeById = useMemo(
    () => new Map(simNodes.map((node) => [node.id, node])),
    [simNodes]
  );

  const defaultSelectedId = useMemo(() => simNodes[0]?.id || '', [simNodes]);

  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  useEffect(() => {
    setSelectedId((current) => {
      if (current && simNodes.some((node) => node.id === current)) {
        return current;
      }
      return defaultSelectedId;
    });
  }, [defaultSelectedId, simNodes]);

  const selectedNode = nodeById.get(selectedId) || simNodes[0];

  const linkHighlight = (link) => {
    const s = link.source;
    const t = link.target;
    if (typeof s === 'string' || typeof t === 'string') return false;
    const ids = [s.id, t.id];
    if (hoverId && ids.includes(hoverId)) return true;
    if (selectedId && ids.includes(selectedId)) return true;
    return false;
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span>{introName}</span>
          <ViewModeToggle mode={mode} onChange={onChangeMode} />
        </h1>
      </header>

      <section
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Entry relationship graph"
      >
        <div ref={graphSurfaceRef} className={styles.graphSurface}>
          <div
            ref={zoomLayerRef}
            className={styles.zoomLayer}
            style={{
              width: graphWidth,
              height: graphHeight,
              transform: transform.toString(),
              transformOrigin: '0 0'
            }}
          >
            <svg
              className={styles.edgesSvg}
              width={graphWidth}
              height={graphHeight}
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              preserveAspectRatio="xMidYMin meet"
              aria-hidden="true"
            >
              <rect
                className={styles.zoomHit}
                width={graphWidth}
                height={graphHeight}
                aria-hidden="true"
              />
              <g className={styles.edgeGroup}>
                {simLinks.map((link) => (
                  <path
                    key={edgeKey(link)}
                    className={styles.edgePath}
                    data-highlight={linkHighlight(link)}
                    d={straightEdgePath(link)}
                  />
                ))}
              </g>
            </svg>

            <div
              className={styles.nodeStack}
              style={{ minHeight: `${graphHeight}px` }}
            >
              {simNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    ref={(el) => {
                      nodeElRefs.current[node.id] = el;
                    }}
                    type="button"
                    className={styles.node}
                    data-selected={isSelected}
                    data-type={node.nodeType}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setSelectedId(node.id)}
                    onMouseEnter={() => setHoverId(node.id)}
                    onMouseLeave={() => setHoverId(null)}
                    aria-label={`${node.nodeType}: ${node.label}${node.year ? ` (${node.year})` : ''}`}
                    title={
                      [node.label, node.year, node.subtitle]
                        .filter(Boolean)
                        .join(' — ')
                    }
                  >
                    <span className={styles.nodeBadge}>{node.nodeType}</span>
                    <span className={styles.nodeTitle}>{node.label}</span>
                    {(node.year || node.category) && (
                      <span className={styles.nodeMeta}>
                        {[node.year, node.category].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EntryGraphView;
