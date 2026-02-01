import React, { useMemo } from 'react';
import { MindMapNode } from '@/types';

interface NodePosition {
  node: MindMapNode;
  x: number;
  y: number;
  level: number;
  parentX?: number;
  parentY?: number;
}

// Calculate 2D positions for all nodes in a radial layout
const calculatePositions = (
  node: MindMapNode,
  centerX: number,
  centerY: number,
  level: number = 0,
  angleStart: number = 0,
  angleEnd: number = 2 * Math.PI,
  parentX?: number,
  parentY?: number
): NodePosition[] => {
  const positions: NodePosition[] = [];
  const radiusStep = 140;
  const radius = level * radiusStep;

  let x: number, y: number;

  if (level === 0) {
    x = centerX;
    y = centerY;
  } else {
    const angle = (angleStart + angleEnd) / 2;
    x = centerX + Math.cos(angle) * radius;
    y = centerY + Math.sin(angle) * radius;
  }

  positions.push({ node, x, y, level, parentX, parentY });

  if (node.children && node.children.length > 0) {
    const childCount = node.children.length;
    const angleRange = level === 0 ? 2 * Math.PI : (angleEnd - angleStart) * 0.8;
    const startAngle = level === 0 ? -Math.PI / 2 : angleStart + (angleEnd - angleStart - angleRange) / 2;

    node.children.forEach((child, i) => {
      const childAngleStart = startAngle + (angleRange / childCount) * i;
      const childAngleEnd = startAngle + (angleRange / childCount) * (i + 1);

      const childPositions = calculatePositions(
        child,
        centerX,
        centerY,
        level + 1,
        childAngleStart,
        childAngleEnd,
        x,
        y
      );
      positions.push(...childPositions);
    });
  }

  return positions;
};

const levelColors = [
  'hsl(var(--primary))',
  'hsl(186 94% 42%)', // cyan
  'hsl(142 71% 45%)', // green
  'hsl(38 92% 50%)',  // amber
  'hsl(330 81% 60%)', // pink
];

const MindMap2D: React.FC<{ mindMap: MindMapNode }> = ({ mindMap }) => {
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  const positions = useMemo(
    () => calculatePositions(mindMap, centerX, centerY),
    [mindMap, centerX, centerY]
  );

  return (
    <div className="w-full overflow-auto bg-muted/30 rounded-xl border border-border">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block"
      >
        <defs>
          {/* Gradient for connections */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Connection lines */}
        {positions
          .filter((p) => p.parentX !== undefined && p.parentY !== undefined)
          .map((pos, i) => {
            const midX = (pos.x + pos.parentX!) / 2;
            const midY = (pos.y + pos.parentY!) / 2;
            const controlOffset = 20;

            return (
              <path
                key={`line-${i}`}
                d={`M ${pos.parentX} ${pos.parentY} Q ${midX} ${midY - controlOffset} ${pos.x} ${pos.y}`}
                fill="none"
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                className="transition-all duration-300"
              />
            );
          })}

        {/* Nodes */}
        {positions.map((pos, i) => {
          const isRoot = pos.level === 0;
          const nodeRadius = isRoot ? 50 : Math.max(35 - pos.level * 5, 20);
          const fontSize = isRoot ? 14 : Math.max(12 - pos.level, 9);
          const color = levelColors[pos.level % levelColors.length];

          return (
            <g
              key={pos.node.id}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              {/* Glow effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius + 4}
                fill={color}
                opacity={0.2}
              />

              {/* Main circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={color}
                filter="url(#shadow)"
                className="transition-all duration-200"
              />

              {/* Label */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={fontSize}
                fontWeight={isRoot ? 600 : 500}
                className="pointer-events-none select-none"
              >
                {pos.node.label.length > 15
                  ? pos.node.label.slice(0, 15) + '...'
                  : pos.node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MindMap2D;
