import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  node_type: string;
  domain?: string | null;
  weight?: number | null;
  connectionCount: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relationship_type: string;
  weight?: number | null;
}

interface ForceGraphProps {
  nodes: Array<{
    id: string;
    label: string;
    node_type: string;
    domain?: string | null;
    weight?: number | null;
  }>;
  edges: Array<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    relationship_type: string;
    weight?: number | null;
  }>;
  onNodeClick?: (nodeId: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  customer: "hsl(217, 91%, 60%)",
  merchant: "hsl(142, 71%, 45%)",
  pattern: "hsl(0, 84%, 60%)",
  order: "hsl(45, 93%, 47%)",
};

const ForceGraph = ({ nodes, edges, onNodeClick }: ForceGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Observe container size
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parent = svg.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // Build and run simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const connectionCounts: Record<string, number> = {};
    edges.forEach((e) => {
      if (nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id)) {
        connectionCounts[e.source_node_id] = (connectionCounts[e.source_node_id] || 0) + 1;
        connectionCounts[e.target_node_id] = (connectionCounts[e.target_node_id] || 0) + 1;
      }
    });

    const gNodes: GraphNode[] = nodes.map((n) => ({
      ...n,
      connectionCount: connectionCounts[n.id] || 0,
    }));

    const gLinks: GraphLink[] = edges
      .filter((e) => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id))
      .map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        relationship_type: e.relationship_type,
        weight: e.weight,
      }));

    const sim = forceSimulation<GraphNode>(gNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(gLinks)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collide", forceCollide<GraphNode>().radius((d) => getRadius(d) + 4))
      .alphaDecay(0.03);

    sim.on("tick", () => {
      setSimulatedNodes([...gNodes]);
      setSimulatedLinks([...gLinks]);
    });

    return () => {
      sim.stop();
    };
  }, [nodes, edges, dimensions]);

  const getRadius = (node: GraphNode) => {
    const base = 6;
    return base + Math.min(node.connectionCount * 1.5, 14);
  };

  const getColor = (type: string) => NODE_COLORS[type] || "hsl(var(--muted-foreground))";

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === "rect") {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      setTransform((t) => ({
        ...t,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      }));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      k: Math.max(0.2, Math.min(3, t.k * delta)),
    }));
  }, []);

  const hoveredLinks = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>();
    simulatedLinks.forEach((l) => {
      const src = typeof l.source === "object" ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : String(l.target);
      if (src === hoveredNode || tgt === hoveredNode) s.add(l.id);
    });
    return s;
  }, [hoveredNode, simulatedLinks]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>([hoveredNode]);
    simulatedLinks.forEach((l) => {
      const src = typeof l.source === "object" ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : String(l.target);
      if (src === hoveredNode) s.add(tgt);
      if (tgt === hoveredNode) s.add(src);
    });
    return s;
  }, [hoveredNode, simulatedLinks]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <rect width="100%" height="100%" fill="transparent" />
      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
        {/* Links */}
        {simulatedLinks.map((link) => {
          const src = link.source as GraphNode;
          const tgt = link.target as GraphNode;
          if (!src.x || !src.y || !tgt.x || !tgt.y) return null;
          const highlighted = hoveredLinks.has(link.id);
          const dimmed = hoveredNode && !highlighted;
          return (
            <line
              key={link.id}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={highlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={highlighted ? 2 : 1}
              strokeOpacity={dimmed ? 0.1 : highlighted ? 0.9 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {simulatedNodes.map((node) => {
          if (!node.x || !node.y) return null;
          const r = getRadius(node);
          const isHovered = hoveredNode === node.id;
          const isConnected = connectedNodes.has(node.id);
          const dimmed = hoveredNode && !isConnected;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick?.(node.id)}
              className="cursor-pointer"
            >
              {/* Glow on hover */}
              {isHovered && (
                <circle r={r + 6} fill={getColor(node.node_type)} opacity={0.15} />
              )}
              <circle
                r={r}
                fill={getColor(node.node_type)}
                opacity={dimmed ? 0.15 : 1}
                stroke={isHovered ? "hsl(var(--foreground))" : "none"}
                strokeWidth={2}
              />
              {/* Label on hover or large nodes */}
              {(isHovered || r > 14) && (
                <text
                  y={r + 14}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={11}
                  fontWeight={isHovered ? 600 : 400}
                  opacity={dimmed ? 0.2 : 1}
                  style={{ pointerEvents: "none" }}
                >
                  {node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Tooltip */}
      {hoveredNode && (() => {
        const node = simulatedNodes.find((n) => n.id === hoveredNode);
        if (!node || !node.x || !node.y) return null;
        const tx = node.x * transform.k + transform.x;
        const ty = node.y * transform.k + transform.y;
        return (
          <foreignObject x={tx + 15} y={ty - 40} width={200} height={80} style={{ pointerEvents: "none" }}>
            <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
              <div className="font-semibold text-foreground">{node.label}</div>
              <div className="text-muted-foreground capitalize">{node.node_type} · {node.domain || "general"}</div>
              <div className="text-muted-foreground">{node.connectionCount} connections · weight {Number(node.weight || 1).toFixed(1)}</div>
            </div>
          </foreignObject>
        );
      })()}
    </svg>
  );
};

export default ForceGraph;
