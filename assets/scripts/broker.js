chrome.storage.local.get(({ settings }) => {
	sendPayload({
		action: 'setColorScheme',
		storage: settings
	})
}),
chrome.storage.local.onChanged.addListener(({ settings }) => {
	settings && sendPayload({
		action: 'updateColorScheme',
		storage: settings.newValue
	})
});

function sendPayload(data) {
	return postMessage(Object.assign({ sender: 'frhd-themes' }, data))
}