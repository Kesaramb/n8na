import {
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	updateDisplayOptions,
	type INodeProperties,
} from 'n8n-workflow';

import type { Filters } from '../../helpers/interfaces';
import { parseRequestBody } from '../../helpers/utils';

const properties: INodeProperties[] = [
	{
		displayName: 'User Pool',
		name: 'userPoolId',
		required: true,
		type: 'resourceLocator',
		default: {
			mode: 'list',
			value: '',
		},
		description: 'The user pool where the users are managed',
		routing: {
			send: {
				type: 'body',
				property: 'UserPoolId',
			},
		},
		modes: [
			{
				displayName: 'From list',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchUserPools',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. eu-central-1_ab12cdefgh',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[a-zA-Z0-9-]+_[0-9a-zA-Z]+$',
							errorMessage: 'The ID must follow the pattern "xx-xx-xx_xxxxxx"',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		type: 'boolean',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		required: true,
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 20,
		description: 'Max number of results to return',
		displayOptions: { show: { returnAll: [false] } },
		routing: { send: { type: 'body', property: 'Limit' } },
	},
	{
		displayName: 'Simplify',
		name: 'simple',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'fixedCollection',
		placeholder: 'Add Filter',
		default: [],
		routing: {
			send: {
				preSend: [
					async function (
						this: IExecuteSingleFunctions,
						requestOptions: IHttpRequestOptions,
					): Promise<IHttpRequestOptions> {
						const filters = this.getNodeParameter('filters', {}) as Filters;
						const filter = filters.filter;
						if (!filter?.value) return requestOptions;
						const { attribute: filterAttribute, value: filterValue } = filter;
						const body = parseRequestBody(requestOptions.body);
						const filterString = filterAttribute ? `"${filterAttribute}"^="${filterValue}"` : '';
						return {
							...requestOptions,
							body: JSON.stringify({ ...body, Filter: filterString }),
						};
					},
				],
			},
		},
		options: [
			{
				displayName: 'Filter',
				name: 'filter',
				values: [
					{
						displayName: 'Attribute',
						name: 'attribute',
						type: 'options',
						default: 'email',
						description: 'The attribute to search for',
						options: [
							{ name: 'Cognito User Status', value: 'cognito:user_status' },
							{ name: 'Email', value: 'email' },
							{ name: 'Family Name', value: 'family_name' },
							{ name: 'Given Name', value: 'given_name' },
							{ name: 'Name', value: 'name' },
							{ name: 'Phone Number', value: 'phone_number' },
							{ name: 'Preferred Username', value: 'preferred_username' },
							{ name: 'Status (Enabled)', value: 'status' },
							{ name: 'Sub', value: 'sub' },
							{ name: 'Username', value: 'username' },
						],
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'The value of the attribute to search for',
					},
				],
			},
		],
	},
];

const displayOptions = {
	show: {
		resource: ['user'],
		operation: ['getAll'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);
