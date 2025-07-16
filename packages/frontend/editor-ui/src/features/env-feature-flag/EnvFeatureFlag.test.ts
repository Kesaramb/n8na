import { createComponentRenderer } from '@/__tests__/render';
import { createTestingPinia } from '@pinia/testing';
import EnvFeatureFlag from './EnvFeatureFlag.vue';
import type { MockInstance } from 'vitest';

const renderComponent = createComponentRenderer(EnvFeatureFlag, {
	pinia: createTestingPinia(),
});

describe('EnvFeatureFlag', () => {
	const originalEnv = import.meta.env;
	let consoleWarnSpy: MockInstance;

	beforeEach(() => {
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Reset env to clean state
		const env = import.meta.env as Record<string, string | boolean | undefined>;
		for (const key in env) {
			if (key.startsWith('VUE_FEAT_')) {
				delete env[key];
			}
		}
	});

	afterEach(() => {
		consoleWarnSpy.mockRestore();
		Object.assign(import.meta.env, originalEnv);
	});

	test.each([
		// Truthy values that should render content
		['true', 'TEST_FLAG', true],
		['enabled', 'TEST_FLAG', true],
		['yes', 'TEST_FLAG', true],
		['1', 'TEST_FLAG', true],
		['on', 'TEST_FLAG', true],
		[true, 'TEST_FLAG', true],
		// Special case for numeric 0
		// import.meta.env in Vite automatically converts all environment variables to strings
		[0, 'TEST_FLAG', true],

		// Falsy values that should not render content
		['false', 'TEST_FLAG', false],
		[false, 'TEST_FLAG', false],
		['', 'TEST_FLAG', false],
		[undefined, 'TEST_FLAG', false],
	])(
		'should %s render slot content when feature flag value is %s',
		(value, flagName, shouldRender) => {
			const envKey = `VUE_FEAT_${flagName}`;

			if (value === undefined) {
				Object.assign(import.meta.env, {});
			} else {
				Object.assign(import.meta.env, {
					[envKey]: value,
				});
			}

			const { container } = renderComponent({
				props: {
					name: flagName,
				},
				slots: {
					default: '<div data-testid="slot-content">Feature content</div>',
				},
			});

			if (shouldRender) {
				expect(container.querySelector('[data-testid="slot-content"]')).toBeTruthy();
			} else {
				expect(container.querySelector('[data-testid="slot-content"]')).toBeNull();
			}
		},
	);

	it('should render wrapper div regardless of feature flag state', () => {
		Object.assign(import.meta.env, {
			VUE_FEAT_TEST_FLAG: 'false',
		});

		const { container } = renderComponent({
			props: {
				name: 'TEST_FLAG',
			},
			slots: {
				default: '<div>Feature content</div>',
			},
		});

		expect(container.querySelector('div')).toBeTruthy();
	});

	it('should work with different flag names', () => {
		Object.assign(import.meta.env, {
			VUE_FEAT_WORKFLOW_DIFFS: 'true',
			VUE_FEAT_ANOTHER_FEATURE: 'false',
		});

		const { container: container1 } = renderComponent({
			props: {
				name: 'WORKFLOW_DIFFS',
			},
			slots: {
				default: '<div data-testid="feature-1">Feature 1</div>',
			},
		});

		const { container: container2 } = renderComponent({
			props: {
				name: 'ANOTHER_FEATURE',
			},
			slots: {
				default: '<div data-testid="feature-2">Feature 2</div>',
			},
		});

		expect(container1.querySelector('[data-testid="feature-1"]')).toBeTruthy();
		expect(container2.querySelector('[data-testid="feature-2"]')).toBeNull();
	});
});
