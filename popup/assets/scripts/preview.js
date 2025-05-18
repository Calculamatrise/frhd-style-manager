const STYLES_DIR = '../shared/styles/'
	, THEMES_DIR = '../shared/styles/themes/'
	, ADAPATIVE_THEMES_DIR = THEMES_DIR + 'adaptive/';

const stylePreview = document.getElementById('style-preview')
	, themePreview = document.getElementById('theme-preview');

chrome.storage.local.onChanged.addListener(({ settings }) => settings && updateStyleSheets(settings.newValue));
chrome.storage.local.get(({ settings }) => updateStyleSheets(settings));

async function updateStyleSheets({ adaptiveTheme, previewTheme, style, theme }) {
	if (!previewTheme) {
		stylePreview.removeAttribute('href');
		themePreview.removeAttribute('href');
		return;
	}

	stylePreview.setAttribute('href', STYLES_DIR + style + '.css');

	let themeHref = THEMES_DIR + (adaptiveTheme ? 'adaptive/' : '') + theme + '.css';
	await fetch(themeHref)
		.catch(err => {
			if (adaptiveTheme)
				themeHref = THEMES_DIR + theme + '.css';
		});
	themePreview.setAttribute('href', themeHref)
}