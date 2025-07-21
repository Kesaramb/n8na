import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AuthenticatedRequest } from '@n8n/db';
import { Post, RestController } from '@n8n/decorators';
import type { Response } from 'express';

import { McpService } from '@/services/mcp.service';

export type FlushableResponse = Response & { flush: () => void };

@RestController('/mcp-control')
export class McpController {
	constructor(private readonly mcpService: McpService) {}

	@Post('/mcp', { rateLimit: { limit: 100 }, apiKeyAuth: true })
	async build(req: AuthenticatedRequest, res: FlushableResponse) {
		// In stateless mode, create a new instance of transport and server for each request
		// to ensure complete isolation. A single instance would cause request ID collisions
		// when multiple clients connect concurrently.
		console.log('Handling MCP request:', req.method, req.url);
		try {
			const server = this.mcpService.getServer(req.user);
			const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});
			res.on('close', () => {
				void transport.close();
				void server?.close();
			});
			await server?.connect(transport);
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			console.error('Error handling MCP request:', error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: 'Internal server error',
					},
					id: null,
				});
			}
		}
	}
}
