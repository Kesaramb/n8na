import { readFileSync } from 'fs';
import { jsonParse, type INodeTypeDescription } from 'n8n-workflow';
import { join } from 'path';

interface NodeWithVersion extends INodeTypeDescription {
	version: number | number[];
	defaultVersion?: number;
}

export function loadNodesFromFile(): INodeTypeDescription[] {
	console.log('Loading nodes from nodes.json...');

	const nodesPath = join(__dirname, 'nodes.json');
	const nodesData = readFileSync(nodesPath, 'utf-8');
	const allNodes = jsonParse<NodeWithVersion[]>(nodesData);

	console.log(`Total nodes loaded: ${allNodes.length}`);

	// Group nodes by name
	const nodesByName = new Map<string, NodeWithVersion[]>();

	for (const node of allNodes) {
		const existing = nodesByName.get(node.name) ?? [];
		existing.push(node);
		nodesByName.set(node.name, existing);
	}

	console.log(`Unique node types: ${nodesByName.size}`);

	// Extract latest version for each node
	const latestNodes: INodeTypeDescription[] = [];
	let multiVersionCount = 0;

	for (const [_nodeName, versions] of nodesByName.entries()) {
		if (versions.length > 1) {
			multiVersionCount++;
			// Find the node with the default version
			let selectedNode: NodeWithVersion | undefined;

			for (const node of versions) {
				// Select the node that matches the default version
				if (node.defaultVersion !== undefined) {
					if (Array.isArray(node.version)) {
						// For array versions, check if it includes the default version
						if (node.version.includes(node.defaultVersion)) {
							selectedNode = node;
						}
					} else if (node.version === node.defaultVersion) {
						selectedNode = node;
					}
				}
			}

			// If we found a matching node, use it; otherwise use the first one
			if (selectedNode) {
				latestNodes.push(selectedNode);
			} else {
				latestNodes.push(versions[0]);
			}
		} else {
			// Single version node
			latestNodes.push(versions[0]);
		}
	}

	console.log(`\nNodes with multiple versions: ${multiVersionCount}`);
	console.log(`Final node count: ${latestNodes.length}`);

	// Filter out hidden nodes
	const visibleNodes = latestNodes.filter((node) => !node.hidden);
	console.log(`Visible nodes (after filtering hidden): ${visibleNodes.length}\n`);

	return visibleNodes;
}

// Helper function to get specific node version for testing
export function getNodeVersion(nodes: INodeTypeDescription[], nodeName: string): string {
	const node = nodes.find((n) => n.name === nodeName);
	if (!node) return 'not found';

	const version = (node as NodeWithVersion).version;
	if (Array.isArray(version)) {
		return `[${version.join(', ')}]`;
	}
	return version?.toString() || 'unknown';
}
