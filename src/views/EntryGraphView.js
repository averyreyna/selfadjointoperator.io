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

const COLLISION_R = 64;
const NODE_HALF_WIDTH = 28;
const NODE_HALF_HEIGHT = 12;
const FIT_PADDING = 28;
const DRAG_CLICK_DISTANCE = 6;
// sync ticks before the async d3 timer so strict mode / early unmount doesn’t leave a blank first paint.
const PREWARM_TICKS = 300;

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function hasFinitePoint(node) {
  return !!node && isFiniteNumber(node.x) && isFiniteNumber(node.y);
}

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
  if (!hasFinitePoint(s) || !hasFinitePoint(t)) return '';
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  if (!isFiniteNumber(dx) || !isFiniteNumber(dy)) return '';
  const isZeroLength = Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001;

  if (isZeroLength) {
    return `M${s.x},${s.y}L${t.x},${t.y}`;
  }

  // trim the segment to the node “radius” so lines meet the pill edges instead of the center point.
  const sourceScale = 1 / Math.max(Math.abs(dx) / NODE_HALF_WIDTH, Math.abs(dy) / NODE_HALF_HEIGHT);
  const targetScale = 1 / Math.max(Math.abs(dx) / NODE_HALF_WIDTH, Math.abs(dy) / NODE_HALF_HEIGHT);

  const x1 = s.x + dx * sourceScale;
  const y1 = s.y + dy * sourceScale;
  const x2 = t.x - dx * targetScale;
  const y2 = t.y - dy * targetScale;

  return `M${x1},${y1}L${x2},${y2}`;
}

const NODE_CATEGORY_ICONS = {
  IA: '◇',
  WIP: '◌',
};

const NODE_TYPE_ICONS = {
  project: '◆',
  writing: '✦',
  research: '⊕',
  work: '▣'
};

const LEGEND_ENTRIES = [
  { icon: '◇', label: 'Internet Art' },
  { icon: '◆', label: 'Project' },
  { icon: '⊕', label: 'Research' },
  { icon: '▣', label: 'Work' },
  { icon: '◌', label: 'Work in Progress' },
  { icon: '✦', label: 'Writing' },
];

function iconForNode(node) {
  return NODE_CATEGORY_ICONS[node.category] || NODE_TYPE_ICONS[node.nodeType] || '·';
}

function EntryGraphView({ nodes, edges, introName, mode, onChangeMode }) {
  const canvasRef = useRef(null);
  const graphSurfaceRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
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
  const [showHint, setShowHint] = useState(() => window.innerWidth < 600);

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

  const graphWidth = canvasWidth > 0 ? canvasWidth : 400;
  // force layout height tracks the visible canvas so nodes aren’t laid out in a taller box than you see.
  const graphHeight = Math.max(canvasHeight || 360, 360);

  useEffect(() => {
    if (!nodes.length) {
      setSimNodes([]);
      setSimLinks([]);
      return;
    }

    const gw = canvasWidth > 0 ? canvasWidth : 400;
    const gh =
      canvasHeight > 0
        ? Math.max(280, canvasHeight)
        : Math.max(360, Math.floor(window.innerHeight * 0.42));

    const simNodeObjs = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const r = Math.min(gw, gh) * 0.28;
      return {
        ...n,
        x: gw / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 20,
        y: gh / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 20
      };
    });

    const linkObjs = edges.map((e) => ({
      source: e.source,
      target: e.target
    }));

    const degreeMap = new Map(simNodeObjs.map((n) => [n.id, 0]));
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });
    const maxDegree = Math.max(...degreeMap.values(), 1);
    const cx = gw / 2;
    const cy = gh / 2;
    const maxRadius = Math.min(gw, gh) * 0.28;

    // hubs (high degree) get pulled inward; low-degree nodes sit farther out for readable leaf placement.
    function radialByDegree(alpha) {
      simNodeObjs.forEach((node) => {
        const deg = degreeMap.get(node.id) || 0;
        const targetR = maxRadius * Math.pow(1 - deg / maxDegree, 0.7) + 8;
        const dx = node.x - cx;
        const dy = node.y - cy;
        const currentR = Math.sqrt(dx * dx + dy * dy) || 1;
        const k = alpha * 0.35;
        node.vx -= (dx / currentR) * (currentR - targetR) * k;
        node.vy -= (dy / currentR) * (currentR - targetR) * k;
      });
    }

    const simulation = d3
      .forceSimulation(simNodeObjs)
      .force(
        'link',
        d3
          .forceLink(linkObjs)
          .id((d) => d.id)
          .distance((link) => {
            const sd = degreeMap.get(link.source.id ?? link.source) || 1;
            const td = degreeMap.get(link.target.id ?? link.target) || 1;
            const minDeg = Math.min(sd, td);
            return 90 + (1 / minDeg) * 50;
          })
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(cx, cy).strength(0.08))
      .force('collide', d3.forceCollide(COLLISION_R))
      .force('radial', radialByDegree);

    simulationRef.current = simulation;

    let firstTick = true;
    const applyTick = () => {
      // d3 can briefly produce NaN; never forward that into react styles or path attrs.
      const safeNodes = simNodeObjs.map((node) => ({
        ...node,
        x: isFiniteNumber(node.x) ? node.x : gw / 2,
        y: isFiniteNumber(node.y) ? node.y : gh / 2
      }));
      setSimNodes(safeNodes);
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
      .scaleExtent([0.2, 2.6])
      .filter((event) => {
        if (event.target.closest?.('button')) {
          return event.type === 'wheel';
        }
        return !event.button;
      })
      .on('zoom', (event) => {
        setTransform(event.transform);
        setShowHint(false);
      });

    zoomBehaviorRef.current = zoomFn;
    d3.select(el).call(zoomFn);

    return () => {
      zoomBehaviorRef.current = null;
      d3.select(el).on('.zoom', null);
    };
  }, [simNodes.length]);

  useLayoutEffect(() => {
    const surfaceEl = graphSurfaceRef.current;
    const zoomFn = zoomBehaviorRef.current;
    if (!surfaceEl || !zoomFn || !simNodes.length || layoutVersion === 0) return;

    const surfaceWidth = surfaceEl.clientWidth;
    const surfaceHeight = surfaceEl.clientHeight;
    if (surfaceWidth <= 0 || surfaceHeight <= 0) return;

    const validNodes = simNodes.filter(hasFinitePoint);
    if (!validNodes.length) return;

    const minX = Math.min(...validNodes.map((node) => node.x - NODE_HALF_WIDTH));
    const maxX = Math.max(...validNodes.map((node) => node.x + NODE_HALF_WIDTH));
    const minY = Math.min(...validNodes.map((node) => node.y - NODE_HALF_HEIGHT));
    const maxY = Math.max(...validNodes.map((node) => node.y + NODE_HALF_HEIGHT));
    if (![minX, maxX, minY, maxY].every(isFiniteNumber)) return;

    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const fitPadding = surfaceWidth < 600 ? 48 : FIT_PADDING;
    const scale = Math.max(
      0.2,
      Math.min(
        1,
        (surfaceWidth - fitPadding * 2) / contentWidth,
        (surfaceHeight - fitPadding * 2) / contentHeight
      )
    );

    const tx = surfaceWidth / 2 - (minX + contentWidth / 2) * scale;
    const ty = surfaceHeight / 2 - (minY + contentHeight / 2) * scale;
    const fitTransform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    d3.select(surfaceEl).call(zoomFn.transform, fitTransform);
  }, [layoutVersion, simNodes, canvasWidth, canvasHeight]);

  useLayoutEffect(() => {
    const sim = simulationRef.current;
    const zoomLayer = zoomLayerRef.current;
    if (!sim || !zoomLayer || layoutVersion === 0) return;

    const dragBehavior = d3
      .drag()
      .clickDistance(DRAG_CLICK_DISTANCE)
      .filter((event) => !event.button && event.isPrimary !== false)
      .subject((event, d) => d)
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.35).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        const t = transformRef.current;
        // pointer is in screen space; invert current zoom so fx/fy stay in graph coordinates.
        const [gx, gy] = t.invert(d3.pointer(event, zoomLayer));
        if (!isFiniteNumber(gx) || !isFiniteNumber(gy)) return;
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
  const safeGraphWidth = isFiniteNumber(graphWidth) ? Math.max(1, graphWidth) : 400;
  const safeGraphHeight = isFiniteNumber(graphHeight) ? Math.max(1, graphHeight) : 360;

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
              width: safeGraphWidth,
              height: safeGraphHeight,
              transform: transform.toString(),
              transformOrigin: '0 0'
            }}
          >
            <svg
              className={styles.edgesSvg}
              width={safeGraphWidth}
              height={safeGraphHeight}
              viewBox={`0 0 ${safeGraphWidth} ${safeGraphHeight}`}
              preserveAspectRatio="xMidYMin meet"
              aria-hidden="true"
            >
              <rect
                className={styles.zoomHit}
                width={safeGraphWidth}
                height={safeGraphHeight}
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
              style={{ minHeight: `${safeGraphHeight}px` }}
            >
              {simNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const safeNodeX = isFiniteNumber(node.x) ? node.x : safeGraphWidth / 2;
                const safeNodeY = isFiniteNumber(node.y) ? node.y : safeGraphHeight / 2;
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
                      left: `${safeNodeX}px`,
                      top: `${safeNodeY}px`,
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
                    <span className={styles.nodeHeader}>
                      <span className={styles.nodeBadge} aria-hidden="true">{iconForNode(node)}</span>
                      <span className={styles.nodeTitle}>{node.label}</span>
                    </span>
                    {node.year && (
                      <span className={styles.nodeMeta}>{node.year}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <aside className={styles.legend} aria-label="Node type key">
          {LEGEND_ENTRIES.map(({ icon, label }) => (
            <div key={label} className={styles.legendRow}>
              <span className={styles.legendIcon} aria-hidden="true">{icon}</span>
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </aside>
        {showHint && (
          <div className={styles.touchHint} aria-hidden="true">
            pinch to zoom · drag to pan
          </div>
        )}
      </section>
    </main>
  );
}

export default EntryGraphView;
