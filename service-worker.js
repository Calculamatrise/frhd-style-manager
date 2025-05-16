import defaults from "./constants/defaults.js";

const documentUrlPatterns = [
	"*://frhd.kanoapps.com/*",
	"*://www.freeriderhd.com/*"
];
const contentScriptTemplate = {
	excludeMatches: [
		"*://*/*\?ajax*",
		"*://*/*&ajax*",
		"*://*.com/*api/*"
	],
	matches: documentUrlPatterns
};
const STYLE_SCRIPT_ID = 'style';
const STYLE_SCRIPT = {
	id: STYLE_SCRIPT_ID,
	css: ["assets/styles/themes/light.css"]
};
const contentScripts = [
	Object.assign({}, contentScriptTemplate, {
		css: ["assets/styles/base.css"],
		id: crypto.randomUUID(),
		js: ["assets/scripts/broker.js"]
	}),
	Object.assign({}, contentScriptTemplate, {
		id: "custom",
		js: [
			"assets/scripts/ThirdPartyStyleManager.js",
			"assets/scripts/custom.js"
		],
		runAt: "document_start",
		world: "MAIN"
	}),
	Object.assign({}, contentScriptTemplate, STYLE_SCRIPT, {
		world: "MAIN"
	})
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

self.addEventListener('activate', async function() {
	chrome.storage.local.get(({ enabled }) => {
		typeof enabled != 'undefined' && setState({ enabled })
	})
});

self.addEventListener('install', async function() {
	await chrome.scripting.unregisterContentScripts();
	chrome.storage.local.get(async ({ enabled = true, settings }) => {
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
		await initContentScripts();
		await chrome.storage.local.get(setTheme);
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

async function initContentScripts() {
	const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
	if (registeredScripts.length < 1) {
		chrome.scripting.registerContentScripts(contentScripts);
	}
}

async function fetchContentScript(...args) {
	const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
	if (registeredScripts.length < 1) return null;
	const match = registeredScripts.find(({ id }) => id == args[0]);
	let callback = args.at(-1);
	typeof callback == 'function' && callback(match);
	return match ?? null
}

async function setTheme({ settings: { style, theme }}) {
	// STYLE_SCRIPT.css.splice(0);
	// Only remove style/theme scripts so that modular addon styles persist
	const styleScripts = STYLE_SCRIPT.css.filter(path => /^assets\/styles\/(themes\/)?\w+\.css$/.test(path));
	for (const styleScript of styleScripts) {
		STYLE_SCRIPT.css.splice(STYLE_SCRIPT.css.indexOf(styleScript), 1);
	}

	style && style != 'default' && STYLE_SCRIPT.css.push("assets/styles/" + style + ".css");
	STYLE_SCRIPT.css.push("assets/styles/themes/" + theme + ".css");
	return STYLE_SCRIPT
}

async function updateStyleScript({ settings }) {
	const styleScript = await fetchContentScript(STYLE_SCRIPT_ID);
	toggleModule('comments', settings.independentCommentScroll);
	styleScript && await chrome.scripting.updateContentScripts([await setTheme(...arguments)]).catch(err => {
		console.warn(err)
	});
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