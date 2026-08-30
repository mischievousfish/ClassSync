'use client';

import React from 'react';

export type GraphNodeStatus = 'MASTERED' | 'WEAK' | 'UNLEARNED';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status: GraphNodeStatus;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export function KnowledgeGraphVisualizer({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }): React.ReactElement {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg viewBox="0 0 960 520" width="100%" height="420" role="img" aria-label="Knowledge Graph">
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;

        return (
          <g key={`${edge.from}-${edge.to}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#6b7280" strokeWidth={1.5} />
            <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} fontSize="10" fill="#cbd5e1">
              {edge.label ?? 'related'}
            </text>
          </g>
        );
      })}

      {nodes.map((node) => {
        const fill = node.status === 'MASTERED' ? '#22c55e' : node.status === 'WEAK' ? '#f59e0b' : '#9ca3af';
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={28} fill={fill} opacity={0.9} />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight={700}>
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
