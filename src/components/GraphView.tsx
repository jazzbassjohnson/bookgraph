import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Book, GraphNode, EdgeToggles } from '../types';
import { buildGraphData } from '../graphBuilder';
import { SidePanel } from './SidePanel';

interface GraphViewProps {
  books: Book[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphRef = any;

export function GraphView({ books }: GraphViewProps) {
  const graphRef = useRef<GraphRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const [edgeToggles, setEdgeToggles] = useState<EdgeToggles>({
    author: true,
    topic: true,
    theme: true,
    tag: true,
  });
  const [threshold, setThreshold] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Adjust for side panel
  const graphWidth = useMemo(() => {
    return selectedNode ? dimensions.width - 350 : dimensions.width;
  }, [dimensions.width, selectedNode]);

  const graphData = useMemo(() => {
    return buildGraphData(books, edgeToggles, threshold);
  }, [books, edgeToggles, threshold]);

  const handleToggle = (type: keyof EdgeToggles) => {
    setEdgeToggles((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      setHighlightedNodeId(node.id);

      // Center on node
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 500);
        graphRef.current.zoom(2, 500);
      }
    },
    []
  );

  const handleNodeClickFromPanel = useCallback(
    (nodeId: string) => {
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (node) {
        handleNodeClick(node);
      }
    },
    [graphData.nodes, handleNodeClick]
  );

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchingNode = graphData.nodes.find(
        (n) => n.name.toLowerCase().includes(searchLower)
      );
      if (matchingNode) {
        setHighlightedNodeId(matchingNode.id);
        if (graphRef.current) {
          graphRef.current.centerAt(matchingNode.x, matchingNode.y, 500);
          graphRef.current.zoom(2, 500);
        }
      } else {
        setHighlightedNodeId(null);
      }
    } else {
      setHighlightedNodeId(null);
    }
  }, [searchTerm, graphData.nodes]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = node.type === 'book' ? 12 / globalScale : 10 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const nodeSize = node.type === 'book' ? 8 : 6;
      const isHighlighted = node.id === highlightedNodeId;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color || '#999';
      ctx.fill();

      // Draw highlight ring
      if (isHighlighted) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label background
      const bckgDimensions = [textWidth + 4, fontSize + 2].map(
        (n) => n + fontSize * 0.2
      );
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(
        node.x! - bckgDimensions[0] / 2,
        node.y! + nodeSize + 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      // Draw label text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isHighlighted ? '#fff' : '#94a3b8';
      ctx.fillText(label, node.x!, node.y! + nodeSize + 4);
    },
    [highlightedNodeId]
  );

  const linkColor = useCallback(
    (link: { type: string }) => {
      switch (link.type) {
        case 'author':
          return 'rgba(245, 158, 11, 0.3)';
        case 'topic':
          return 'rgba(16, 185, 129, 0.3)';
        case 'theme':
          return 'rgba(236, 72, 153, 0.3)';
        case 'tag':
          return 'rgba(139, 92, 246, 0.3)';
        default:
          return 'rgba(255, 255, 255, 0.1)';
      }
    },
    []
  );

  return (
    <div className="graph-view">
      <div
        className="graph-container"
        ref={containerRef}
        style={{ width: graphWidth }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={graphWidth}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
            const nodeSize = node.type === 'book' ? 8 : 6;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, nodeSize + 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={(node: GraphNode) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          linkColor={linkColor}
          linkWidth={1}
          linkDirectionalParticles={0}
          backgroundColor="#0f172a"
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />

        <div className="graph-controls">
          <h3>Edge Types</h3>
          <div className="toggle-group">
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={edgeToggles.author}
                onChange={() => handleToggle('author')}
              />
              <span
                className="color-dot"
                style={{ background: '#f59e0b' }}
              ></span>
              Authors
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={edgeToggles.topic}
                onChange={() => handleToggle('topic')}
              />
              <span
                className="color-dot"
                style={{ background: '#10b981' }}
              ></span>
              Topics
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={edgeToggles.theme}
                onChange={() => handleToggle('theme')}
              />
              <span
                className="color-dot"
                style={{ background: '#ec4899' }}
              ></span>
              Themes
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={edgeToggles.tag}
                onChange={() => handleToggle('tag')}
              />
              <span
                className="color-dot"
                style={{ background: '#8b5cf6' }}
              ></span>
              Tags
            </label>
          </div>

          <div className="threshold-control">
            <label>
              Min. connections to show attribute: {threshold}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
            />
            <div className="threshold-value">
              Hides attributes connected to fewer than {threshold} book
              {threshold > 1 ? 's' : ''}
            </div>
          </div>

          <input
            type="text"
            className="graph-search"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="legend">
            <div className="legend-item">
              <span
                className="color-dot"
                style={{ background: '#6366f1', width: 8, height: 8 }}
              ></span>
              Book
            </div>
            <div className="legend-item">
              <span
                className="color-dot"
                style={{ background: '#f59e0b', width: 8, height: 8 }}
              ></span>
              Author
            </div>
            <div className="legend-item">
              <span
                className="color-dot"
                style={{ background: '#10b981', width: 8, height: 8 }}
              ></span>
              Topic
            </div>
            <div className="legend-item">
              <span
                className="color-dot"
                style={{ background: '#ec4899', width: 8, height: 8 }}
              ></span>
              Theme
            </div>
            <div className="legend-item">
              <span
                className="color-dot"
                style={{ background: '#8b5cf6', width: 8, height: 8 }}
              ></span>
              Tag
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (
        <SidePanel
          node={selectedNode}
          books={books}
          onClose={() => {
            setSelectedNode(null);
            setHighlightedNodeId(null);
          }}
          onNodeClick={handleNodeClickFromPanel}
        />
      )}
    </div>
  );
}
