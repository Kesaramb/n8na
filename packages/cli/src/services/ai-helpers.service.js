'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.AiHelpersService = void 0;
const di_1 = require('@n8n/di');
const backend_common_1 = require('@n8n/backend-common');
const NodeHelpers = __importStar(require('n8n-workflow/src/node-helpers'));
const node_types_1 = require('@/node-types');
let AiWorkflowBuilderService;
try {
	AiWorkflowBuilderService = require('@n8n/ai-workflow-builder').AiWorkflowBuilderService;
} catch {}
let AiHelpersService = class AiHelpersService {
	constructor(logger, nodeTypes) {
		this.logger = logger;
		this.nodeTypes = nodeTypes;
		if (AiWorkflowBuilderService) {
			this.aiWorkflowBuilder = new AiWorkflowBuilderService(this.nodeTypes, undefined, this.logger);
		}
	}
	async suggestNodes(workflowData, user, options = {}) {
		this.logger.debug('Generating node suggestions', {
			userId: user.id,
			nodeCount: workflowData.nodes.length,
			currentNodeId: options.currentNodeId,
		});
		if (this.aiWorkflowBuilder) {
			try {
				return await this.generateAISuggestions(workflowData, user, options);
			} catch (error) {
				this.logger.warn('AI suggestion failed, falling back to rule-based', { error });
			}
		}
		return this.generateRuleBasedSuggestions(workflowData, options);
	}
	async mapParameters(sourceNodeId, targetNodeId, workflowData, user) {
		this.logger.debug('Generating parameter mappings', {
			userId: user.id,
			sourceNodeId,
			targetNodeId,
		});
		const sourceNode = workflowData.nodes.find((node) => node.id === sourceNodeId);
		const targetNode = workflowData.nodes.find((node) => node.id === targetNodeId);
		if (!sourceNode || !targetNode) {
			throw new Error('Source or target node not found');
		}
		if (this.aiWorkflowBuilder) {
			try {
				return await this.generateAIParameterMapping(sourceNode, targetNode, user);
			} catch (error) {
				this.logger.warn('AI parameter mapping failed, falling back to rule-based', { error });
			}
		}
		return this.generateRuleBasedParameterMapping(sourceNode, targetNode);
	}
	async provideWorkflowAssistance(workflowData, query, user, context) {
		this.logger.debug('Providing workflow assistance', {
			userId: user.id,
			query: query.substring(0, 50),
			selectedNodeId: context?.selectedNodeId,
		});
		if (this.aiWorkflowBuilder) {
			try {
				return await this.generateAIAssistance(workflowData, query, user, context);
			} catch (error) {
				this.logger.warn('AI assistance failed, falling back to rule-based', { error });
			}
		}
		return this.generateRuleBasedAssistance(workflowData, query, context);
	}
	async getNodeRecommendations(user, criteria = {}) {
		this.logger.debug('Getting node recommendations', {
			userId: user.id,
			criteria,
		});
		const allNodeTypes = this.nodeTypes.getAll();
		const limit = Math.min(criteria.limit || 10, 50);
		const recommendations = allNodeTypes
			.filter((nodeType) => !nodeType.hidden)
			.map((nodeType) => ({
				nodeType: nodeType.name,
				displayName: nodeType.displayName,
				description: nodeType.description,
				category: this.getNodeCategory(nodeType),
				useCase: this.getNodeUseCase(nodeType),
				difficulty: this.getNodeDifficulty(nodeType),
				popularity: this.getNodePopularity(nodeType),
				tags: this.getNodeTags(nodeType),
			}))
			.filter((rec) => {
				if (criteria.category && rec.category !== criteria.category) return false;
				if (criteria.difficulty && rec.difficulty !== criteria.difficulty) return false;
				if (criteria.useCase && !rec.useCase.toLowerCase().includes(criteria.useCase.toLowerCase()))
					return false;
				return true;
			})
			.sort((a, b) => b.popularity - a.popularity)
			.slice(0, limit);
		return recommendations;
	}
	async optimizeWorkflow(workflowData, user, options = {}) {
		this.logger.debug('Optimizing workflow', {
			userId: user.id,
			nodeCount: workflowData.nodes.length,
			optimizationType: options.optimizationType,
		});
		const optimizations = this.analyzeWorkflowOptimizations(workflowData, options.optimizationType);
		return {
			optimizations,
			estimatedImprovement: {
				performance: this.calculatePerformanceImprovement(optimizations),
				maintainability: this.calculateMaintainabilityImprovement(optimizations),
				reliability: this.calculateReliabilityImprovement(optimizations),
			},
		};
	}
	async explainWorkflow(workflowData, user, options = {}) {
		this.logger.debug('Explaining workflow', {
			userId: user.id,
			nodeCount: workflowData.nodes.length,
			explanationType: options.explanationType,
		});
		const { explanationType = 'overview', focusNodeId } = options;
		const flow = workflowData.nodes.map((node) => {
			const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
			const nodeDescription = nodeType?.description;
			return {
				nodeId: node.id,
				nodeName: node.name,
				purpose: this.getNodePurpose(node, nodeDescription),
				inputDescription:
					explanationType !== 'overview'
						? this.getInputDescription(node, nodeDescription)
						: undefined,
				outputDescription:
					explanationType !== 'overview'
						? this.getOutputDescription(node, nodeDescription)
						: undefined,
				keyParameters:
					explanationType === 'detailed' ? this.getKeyParameters(node, nodeDescription) : undefined,
			};
		});
		return {
			overview: this.generateWorkflowOverview(workflowData),
			flow: focusNodeId ? flow.filter((f) => f.nodeId === focusNodeId) : flow,
			complexity: this.determineWorkflowComplexity(workflowData),
			executionTime: this.estimateExecutionTime(workflowData),
			commonPatterns: this.identifyCommonPatterns(workflowData),
			potentialIssues:
				explanationType !== 'overview' ? this.identifyPotentialIssues(workflowData) : undefined,
		};
	}
	async generateAISuggestions(workflowData, user, options) {
		return this.generateRuleBasedSuggestions(workflowData, options);
	}
	async generateAIParameterMapping(sourceNode, targetNode, user) {
		return this.generateRuleBasedParameterMapping(sourceNode, targetNode);
	}
	async generateAIAssistance(workflowData, query, user, context) {
		return this.generateRuleBasedAssistance(workflowData, query, context);
	}
	generateRuleBasedSuggestions(workflowData, options) {
		const { currentNodeId, contextType } = options;
		const allNodeTypes = this.nodeTypes.getAll();
		const suggestions = [];
		if (contextType === 'next_node' && currentNodeId) {
			const currentNode = workflowData.nodes.find((node) => node.id === currentNodeId);
			if (currentNode) {
				const nextNodeTypes = this.getCommonNextNodes(currentNode.type);
				nextNodeTypes.forEach((nodeTypeName, index) => {
					const nodeType = allNodeTypes.find((nt) => nt.name === nodeTypeName);
					if (nodeType && !nodeType.hidden) {
						suggestions.push({
							nodeType: nodeType.name,
							displayName: nodeType.displayName,
							description: nodeType.description,
							category: this.getNodeCategory(nodeType),
							confidence: Math.max(0.9 - index * 0.1, 0.5),
							reasoning: `Commonly used after ${currentNode.type} nodes`,
							connectionHint: {
								position: 'after',
								inputType: 'main',
								outputType: 'main',
							},
						});
					}
				});
			}
		} else {
			const popularNodes = ['Set', 'If', 'HTTP Request', 'Code', 'Merge', 'Switch'];
			popularNodes.forEach((nodeTypeName, index) => {
				const nodeType = allNodeTypes.find((nt) => nt.name === nodeTypeName);
				if (nodeType && !nodeType.hidden) {
					suggestions.push({
						nodeType: nodeType.name,
						displayName: nodeType.displayName,
						description: nodeType.description,
						category: this.getNodeCategory(nodeType),
						confidence: Math.max(0.8 - index * 0.1, 0.4),
						reasoning: 'Commonly used in workflows',
					});
				}
			});
		}
		return suggestions.slice(0, 5);
	}
	generateRuleBasedParameterMapping(sourceNode, targetNode) {
		const mappings = [];
		const suggestions = [];
		const sourceNodeType = this.nodeTypes.getByNameAndVersion(
			sourceNode.type,
			sourceNode.typeVersion,
		);
		const targetNodeType = this.nodeTypes.getByNameAndVersion(
			targetNode.type,
			targetNode.typeVersion,
		);
		if (!sourceNodeType || !targetNodeType) {
			suggestions.push('Could not analyze node types for parameter mapping');
			return { mappings, suggestions };
		}
		const sourceData = sourceNode.parameters || {};
		const targetOutputs = NodeHelpers.getNodeOutputs(targetNodeType, targetNode.parameters);
		const sourceInputs = NodeHelpers.getNodeInputs(sourceNodeType, sourceNode.parameters);
		if (targetNodeType.properties) {
			targetNodeType.properties.forEach((prop) => {
				const isDisplayed = NodeHelpers.displayParameter(
					targetNode.parameters || {},
					prop,
					targetNodeType,
				);
				if (!isDisplayed) return;
				if (prop.type === 'string' && sourceData) {
					const similarFields = Object.keys(sourceData).filter((key) => {
						const similarity = this.calculateFieldSimilarity(key, prop.name);
						return similarity > 0.6;
					});
					if (similarFields.length > 0) {
						const bestMatch = similarFields[0];
						const confidence = this.calculateMappingConfidence(
							sourceNodeType,
							targetNodeType,
							bestMatch,
							prop,
						);
						mappings.push({
							targetParameter: prop.name,
							sourceExpression: `{{ $json.${bestMatch} }}`,
							sourceDescription: `Map from ${sourceNode.name}.${bestMatch}`,
							confidence,
							mappingType: this.determineMappingType(sourceNodeType, targetNodeType, prop),
						});
					}
				}
				if (prop.name === 'url' && sourceData.url) {
					mappings.push({
						targetParameter: 'url',
						sourceExpression: `{{ $json.url }}`,
						sourceDescription: `Direct URL mapping from ${sourceNode.name}`,
						confidence: 0.95,
						mappingType: 'direct',
					});
				}
				if (prop.name === 'email' && (sourceData.email || sourceData.emailAddress)) {
					const sourceField = sourceData.email ? 'email' : 'emailAddress';
					mappings.push({
						targetParameter: 'email',
						sourceExpression: `{{ $json.${sourceField} }}`,
						sourceDescription: `Email mapping from ${sourceNode.name}`,
						confidence: 0.9,
						mappingType: 'direct',
					});
				}
			});
		}
		if (sourceNodeType.group?.includes('trigger') && targetNodeType.group?.includes('action')) {
			suggestions.push('Trigger to action node: Consider mapping event data to action parameters');
		}
		if (this.isDataProcessingNode(sourceNodeType) && this.isDataProcessingNode(targetNodeType)) {
			suggestions.push('Data processing nodes: Use expressions to transform data structure');
		}
		suggestions.push(
			'Consider using expressions to transform data between nodes',
			'Check if the data types match between source and target parameters',
			'Use the Code node for complex data transformations',
		);
		return { mappings, suggestions };
	}
	generateRuleBasedAssistance(workflowData, query, context) {
		const assistance = [];
		const queryLower = query.toLowerCase();
		if (queryLower.includes('error') || queryLower.includes('fail')) {
			assistance.push({
				type: 'fix',
				title: 'Add Error Handling',
				description: 'Consider adding error handling to prevent workflow failures',
				actionable: true,
				actions: [
					{
						type: 'add_node',
						nodeType: 'If',
						parameters: {
							conditions: {
								string: [
									{
										value1: '={{ $json.error }}',
										operation: 'exists',
									},
								],
							},
						},
					},
				],
				priority: 'high',
			});
		}
		if (queryLower.includes('slow') || queryLower.includes('performance')) {
			assistance.push({
				type: 'optimization',
				title: 'Improve Performance',
				description: 'Consider optimizing your workflow for better performance',
				actionable: false,
				priority: 'medium',
			});
		}
		if (queryLower.includes('data') || queryLower.includes('transform')) {
			assistance.push({
				type: 'suggestion',
				title: 'Data Transformation',
				description: 'Use the Set or Code node to transform your data',
				actionable: true,
				actions: [
					{
						type: 'add_node',
						nodeType: 'Set',
					},
				],
				priority: 'medium',
			});
		}
		return assistance;
	}
	getNodeCategory(nodeType) {
		if (nodeType.group) {
			return nodeType.group[0] || 'utility';
		}
		return 'utility';
	}
	getNodeUseCase(nodeType) {
		const name = nodeType.name.toLowerCase();
		if (name.includes('http') || name.includes('webhook')) return 'API communication';
		if (name.includes('database') || name.includes('sql')) return 'data storage';
		if (name.includes('email') || name.includes('slack')) return 'communication';
		if (name.includes('file') || name.includes('csv')) return 'file processing';
		return 'data processing';
	}
	getNodeDifficulty(nodeType) {
		const simpleNodes = ['Set', 'If', 'Merge', 'Switch'];
		const advancedNodes = ['Code', 'Function', 'Execute Command'];
		if (simpleNodes.includes(nodeType.name)) return 'beginner';
		if (advancedNodes.includes(nodeType.name)) return 'advanced';
		return 'intermediate';
	}
	getNodePopularity(nodeType) {
		const popularNodes = {
			'HTTP Request': 100,
			Set: 95,
			If: 90,
			Code: 85,
			Merge: 80,
			Switch: 75,
			Webhook: 70,
		};
		return popularNodes[nodeType.name] || 50;
	}
	getNodeTags(nodeType) {
		const tags = [];
		if (nodeType.group) tags.push(...nodeType.group);
		if (nodeType.name.toLowerCase().includes('api')) tags.push('api');
		if (nodeType.credentials) tags.push('requires-auth');
		return tags;
	}
	getCommonNextNodes(nodeType) {
		const commonNextNodes = {
			'HTTP Request': ['Set', 'If', 'Code', 'Merge'],
			Webhook: ['Set', 'If', 'HTTP Request'],
			Set: ['If', 'HTTP Request', 'Code'],
			If: ['Set', 'HTTP Request', 'Stop and Error'],
			Code: ['Set', 'If', 'HTTP Request'],
		};
		return commonNextNodes[nodeType] || ['Set', 'If', 'HTTP Request'];
	}
	analyzeWorkflowOptimizations(workflowData, optimizationType) {
		const optimizations = [];
		const hasErrorHandling = workflowData.nodes.some(
			(node) => node.type === 'If' && JSON.stringify(node.parameters).includes('error'),
		);
		if (!hasErrorHandling) {
			optimizations.push({
				type: 'error_handling',
				title: 'Add Error Handling',
				description: 'Workflow lacks error handling mechanisms',
				impact: 'high',
				effort: 'low',
				changes: [
					{
						nodeId: 'new-error-handler',
						changeType: 'add',
						description: 'Add If node to check for errors',
						parameters: {
							conditions: {
								string: [{ value1: '={{ $json.error }}', operation: 'exists' }],
							},
						},
					},
				],
			});
		}
		if (workflowData.nodes.length > 10) {
			optimizations.push({
				type: 'structure',
				title: 'Consider Breaking Down Workflow',
				description: 'Large workflows can be hard to maintain',
				impact: 'medium',
				effort: 'high',
				changes: [
					{
						nodeId: 'workflow-split',
						changeType: 'modify',
						description: 'Consider splitting into smaller sub-workflows',
					},
				],
			});
		}
		return optimizations;
	}
	calculatePerformanceImprovement(optimizations) {
		return optimizations.filter((opt) => opt.type === 'performance').length * 15;
	}
	calculateMaintainabilityImprovement(optimizations) {
		return (
			optimizations.filter((opt) => opt.type === 'readability' || opt.type === 'structure').length *
			20
		);
	}
	calculateReliabilityImprovement(optimizations) {
		return optimizations.filter((opt) => opt.type === 'error_handling').length * 25;
	}
	generateWorkflowOverview(workflowData) {
		const nodeCount = workflowData.nodes.length;
		const connectionCount = Object.keys(workflowData.connections || {}).length;
		return `This workflow contains ${nodeCount} nodes and ${connectionCount} connections. It processes data through a series of connected operations to achieve the desired outcome.`;
	}
	getNodePurpose(node, nodeType) {
		if (nodeType) {
			return `${nodeType.displayName}: ${nodeType.description}`;
		}
		return `${node.name}: Performs ${node.type} operations`;
	}
	getInputDescription(node, nodeType) {
		return 'Receives data from connected input nodes';
	}
	getOutputDescription(node, nodeType) {
		return 'Outputs processed data to connected nodes';
	}
	getKeyParameters(node, nodeType) {
		const params = [];
		if (node.parameters) {
			Object.entries(node.parameters)
				.slice(0, 3)
				.forEach(([key, value]) => {
					params.push({
						name: key,
						value,
						explanation: `Configuration parameter for ${key}`,
					});
				});
		}
		return params;
	}
	determineWorkflowComplexity(workflowData) {
		const nodeCount = workflowData.nodes.length;
		if (nodeCount <= 5) return 'simple';
		if (nodeCount <= 15) return 'moderate';
		return 'complex';
	}
	estimateExecutionTime(workflowData) {
		const nodeCount = workflowData.nodes.length;
		const hasHttpNodes = workflowData.nodes.some(
			(node) => node.type.includes('HTTP') || node.type.includes('Request'),
		);
		let baseTime = nodeCount * 0.5;
		if (hasHttpNodes) baseTime += 2;
		if (baseTime < 5) return 'Less than 5 seconds';
		if (baseTime < 30) return '5-30 seconds';
		return 'More than 30 seconds';
	}
	identifyCommonPatterns(workflowData) {
		const patterns = [];
		if (workflowData.nodes.some((node) => node.type === 'Webhook')) {
			patterns.push('Webhook trigger pattern');
		}
		if (workflowData.nodes.some((node) => node.type === 'If')) {
			patterns.push('Conditional logic pattern');
		}
		if (workflowData.nodes.some((node) => node.type.includes('HTTP'))) {
			patterns.push('API integration pattern');
		}
		return patterns;
	}
	identifyPotentialIssues(workflowData) {
		const issues = [];
		const hasErrorHandling = workflowData.nodes.some(
			(node) => node.type === 'If' && JSON.stringify(node.parameters).includes('error'),
		);
		if (!hasErrorHandling) {
			issues.push('No error handling detected');
		}
		if (workflowData.nodes.length > 20) {
			issues.push('Workflow may be too complex');
		}
		return issues;
	}
	calculateFieldSimilarity(field1, field2) {
		const f1 = field1.toLowerCase();
		const f2 = field2.toLowerCase();
		if (f1 === f2) return 1.0;
		if (f1.includes(f2) || f2.includes(f1)) return 0.8;
		const commonWords = ['id', 'name', 'email', 'url', 'address', 'phone', 'date', 'time'];
		for (const word of commonWords) {
			if (f1.includes(word) && f2.includes(word)) return 0.7;
		}
		const distance = this.levenshteinDistance(f1, f2);
		const maxLength = Math.max(f1.length, f2.length);
		return 1 - distance / maxLength;
	}
	levenshteinDistance(str1, str2) {
		const matrix = [];
		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}
		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1,
					);
				}
			}
		}
		return matrix[str2.length][str1.length];
	}
	calculateMappingConfidence(sourceNodeType, targetNodeType, sourceField, targetProperty) {
		let confidence = 0.5;
		if (targetProperty.type === 'string') confidence += 0.2;
		if (sourceNodeType.group?.some((g) => targetNodeType.group?.includes(g))) {
			confidence += 0.2;
		}
		const similarity = this.calculateFieldSimilarity(sourceField, targetProperty.name);
		confidence += similarity * 0.3;
		return Math.min(confidence, 1.0);
	}
	determineMappingType(sourceNodeType, targetNodeType, targetProperty) {
		if (targetProperty.type === 'string' || targetProperty.type === 'number') {
			return 'direct';
		}
		if (
			sourceNodeType.group?.some((g) => !targetNodeType.group?.includes(g)) ||
			targetProperty.type === 'collection'
		) {
			return 'transformation';
		}
		return 'calculated';
	}
	isDataProcessingNode(nodeType) {
		const dataProcessingGroups = ['transform', 'utility', 'output'];
		return nodeType.group?.some((group) => dataProcessingGroups.includes(group)) ?? false;
	}
};
exports.AiHelpersService = AiHelpersService;
exports.AiHelpersService = AiHelpersService = __decorate(
	[
		(0, di_1.Service)(),
		__metadata('design:paramtypes', [backend_common_1.Logger, node_types_1.NodeTypes]),
	],
	AiHelpersService,
);
//# sourceMappingURL=ai-helpers.service.js.map
