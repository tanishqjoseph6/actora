import type { WorkflowConnection, WorkflowNode } from "./types";

export function deriveConnections(nodes: WorkflowNode[]): WorkflowConnection[] {
  return nodes.slice(0, -1).map((node, index) => {
    const target = nodes[index + 1];
    return {
      id: `conn-${node.id}-${target.id}`,
      sourceNodeId: node.id,
      targetNodeId: target.id,
    };
  });
}

export function resolveTriggerBlockId(nodes: WorkflowNode[]): string | null {
  const trigger = nodes.find((n) => n.category === "trigger");
  return trigger?.blockId ?? nodes[0]?.blockId ?? null;
}

export function syncWorkflowGraph(nodes: WorkflowNode[]): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggerBlockId: string | null;
} {
  return {
    nodes,
    connections: deriveConnections(nodes),
    triggerBlockId: resolveTriggerBlockId(nodes),
  };
}
