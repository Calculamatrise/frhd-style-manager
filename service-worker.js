import defaults from "./constants/defaults.js";
import CONTENT_SCRIPT_TEMPLATE from "./constants/contentscripttemp.js";

const STYLE_SCRIPT = {
	id: 'style',
	css: ["shared/styles/themes/light.css"]
};
const contentScripts = [
	Object.assign({}, CONTENT_SCRIPT_TEMPLATE, {
		css: ["shared/styles/base.css"],
		id: crypto.randomUUID(),
		js: ["assets/scripts/broker.js"]
	}),
	Object.assign({}, CONTENT_SCRIPT_TEMPLATE, {
		id: "style-manager",
		js: ["assets/scripts/ThirdPartyStyleManager.js"],
		runAt: "document_end",
		world: "MAIN"
	}),
	Object.assign({}, CONTENT_SCRIPT_TEMPLATE, {
		id: "custom",
		js: ["assets/scripts/custom.js"],
		runAt: "document_start",
		world: "MAIN"
	}),
	Object.assign({}, CONTENT_SCRIPT_TEMPLATE, STYLE_SCRIPT)
];

chrome.runtime.onStartup.addListener(function() {
	self.dispatchEvent(new ExtendableEvent('activate'))
});

chrome.runtime.onUpdateAvailable.addListener(function() {
	chrome.storage.session.set({ updateAvailable: true }).then(() => {
		chrome.action.setBadgeText({ text: '1' })
	})
});

chrome.storage.local.onChanged.addListener(function({ enabled, settings }) {
	enabled && setState({ enabled: enabled.newValue });
	settings && chrome.storage.local.get(({ enabled, settings }) => {
		enabled && updateStyleScript({ settings })
	})
});

self.addEventListener('activate', function() {
	chrome.storage.local.get(({ enabled }) => {
		typeof enabled != 'undefined' && setState({ enabled })
	})
});

self.addEventListener('install', async function() {
	await chrome.scripting.unregisterContentScripts();
	chrome.storage.local.get(({ enabled = true, settings }) => {
		chrome.storage.local.set({
			enabled,
			badges: true,
			settings: Object.assign(defaults, settings)
		})
	})
}, { once: true });

async function setState({ enabled = true }) {
	const path = size => `/icons/${enabled ? '' : 'disabled/'}icon_${size}.png`;
	if (enabled) {
		await chrome.scripting.registerContentScripts(contentScripts);
		await chrome.storage.local.get(updateStyleScript);
	} else {
		await chrome.scripting.unregisterContentScripts();
	}

	return chrome.action.setIcon({
		path: {
			16: path(16),
			48: path(48),
			128: path(128)
		}
	})
}

async function fetchContentScript(scriptId) {
	const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
	if (registeredScripts.length < 1) return null;
	const match = registeredScripts.find(({ id }) => id == scriptId);
	return match ?? null
}

async function setTheme({ settings: { style, theme }}) {
	for (const styleScript of STYLE_SCRIPT.css.filter(path => !path.includes('/modules/'))) {
		STYLE_SCRIPT.css.splice(STYLE_SCRIPT.css.indexOf(styleScript), 1);
	}

	style && style != 'default' && STYLE_SCRIPT.css.push("shared/styles/" + style + ".css");
	STYLE_SCRIPT.css.push("shared/styles/themes/" + theme + ".css");
	return STYLE_SCRIPT
}

async function updateStyleScript({ settings }) {
	const styleScript = await fetchContentScript(STYLE_SCRIPT.id);
	toggleModule('comments', settings.independentCommentScroll);
	styleScript && await chrome.scripting.updateContentScripts([await setTheme(...arguments)])
}

function toggleModule(id, forceState) {
	const path = "assets/styles/modules/" + id + ".css";
	const index = STYLE_SCRIPT.css.indexOf(path);
	forceState === undefined && (forceState = index === -1);
	if (forceState && index === -1) {
		STYLE_SCRIPT.css.push(path);
	} else if (!forceState && index !== -1) {
		STYLE_SCRIPT.css.splice(index, 1);
	}
}