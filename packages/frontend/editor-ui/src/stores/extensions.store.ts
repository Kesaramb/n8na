import { defineStore } from 'pinia';
import type { ExtensionManifest } from '@n8n/extension-sdk';
import type { FrontendExtension, FrontendExtensionContext } from '@n8n/extension-sdk/frontend';
import { STORES } from '@/constants';
import type { Component } from 'vue';
import { ref, reactive, markRaw } from 'vue';
import { useRootStore } from '@/stores/root.store';
import { getExtensions } from '@/api/extensions';

type ExtensionMetadata = {
	components: Record<string, Component>;
};

type ExtensionPoints = {
	views: {
		workflows: {
			header: Component[];
		};
	};
};

export const useExtensionsStore = defineStore(STORES.EXTENSIONS, () => {
	const rootStore = useRootStore();

	const extensionManifests = ref<ExtensionManifest[]>([]);
	const extensionMetadata = reactive<Record<string, ExtensionMetadata>>({});
	const extensionPoints = reactive<ExtensionPoints>({
		views: {
			workflows: {
				header: [],
			},
		},
	});

	function createNamespaceString(manifest: ExtensionManifest) {
		return `${manifest.publisher}/${manifest.name}`;
	}

	function registerNamespace(ns: string) {
		if (!extensionMetadata[ns]) {
			extensionMetadata[ns] = {
				components: {},
			};
		}
	}

	function registerExtensionPoints(manifest: ExtensionManifest) {
		const ns = createNamespaceString(manifest);

		if (manifest.extends?.views.workflows.header) {
			const component: Component =
				extensionMetadata[ns].components[manifest.extends.views.workflows.header];
			extensionPoints.views.workflows.header.push(component);
		}
	}

	function createRegisterComponent(ns: string) {
		registerNamespace(ns);

		return (name: string, component: Component) => {
			extensionMetadata[ns].components[name] = markRaw(component);
		};
	}

	function createExtensionContext(manifest: ExtensionManifest): FrontendExtensionContext {
		const context: FrontendExtensionContext = {};
		const ns = createNamespaceString(manifest);

		if (manifest.extends?.views) {
			context.registerComponent = createRegisterComponent(ns);
		}

		return context;
	}

	async function initialize() {
		await fetchExtensions();

		const loadedExtensions = await Promise.all(extensionManifests.value.map(injectExtensionScript));

		loadedExtensions.forEach((extensionManifest, index) => {
			const extensionContext = createExtensionContext(extensionManifest);
			const extensionModule = window.n8nFrontendExtensions[index];

			extensionModule.setup(extensionContext);

			registerExtensionPoints(extensionManifest);
		});
	}

	async function injectExtensionScript(manifest: ExtensionManifest) {
		const source = `http://localhost:5678/assets/extensions/${manifest.publisher}/${manifest.name}/frontend.js`;
		await injectScript(source);
		return manifest;
	}

	/**
	 * Injects a script into the DOM and waits for it to load.
	 */
	async function injectScript(source: string) {
		return await new Promise((resolve) => {
			// Create a script element and append it as the last child in body
			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.async = true;
			script.src = source;
			script.onload = () => resolve();

			document.body.appendChild(script);
		});
	}

	async function fetchExtensions() {
		const extensions = await getExtensions(rootStore.restApiContext);

		extensions.forEach((extension) => {
			if (!extensionManifests.value.some((e) => e.name === extension.name)) {
				extensionManifests.value.push(extension);
			}
		});
	}

	return {
		extensionManifests,
		extensionMetadata,
		extensionPoints,
		initialize,
	};
});
