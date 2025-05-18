import "../utils/Storage.js";
import defaults from "../constants/defaults.js";

const state = document.querySelector('#state');
state.addEventListener('click', function(event) {
	if (this.classList.contains('update-available')) {
		return chrome.runtime.reload();
	}

	chrome.storage.proxy.local.set('enabled', !chrome.storage.proxy.local.get('enabled'))
}, { passive: true });

chrome.storage.local.onChanged.addListener(({ enabled, settings }) => {
	settings && restoreSettings(settings.newValue),
	enabled && setState(enabled.newValue)
});

chrome.storage.local.get(({ badges, enabled, settings }) => {
	for (const element of document.querySelectorAll('.notification')) {
		if (badges === false) {
			element.classList.remove('notification');
			continue;
		}

		element.addEventListener('click', event => {
			chrome.storage.local.set({ badges: false }).then(() => {
				event.target.classList.remove('notification')
			})
		}, { passive: true });
	}

	restoreSettings(settings),
	setState(enabled)
});

chrome.storage.session.get(({ updateAvailable = false }) => {
	updateAvailable && state.classList.add('update-available') // chrome.action.setBadgeText({ text: '' });
});

const resetSettings = document.querySelector('#reset-settings');
resetSettings.addEventListener('click', () => {
	confirm(`Are you sure you'd like to reset all your settings?`) && chrome.storage.local.set({ settings: defaults }).then(() => {
		alert("Your settings have successfully been reset.")
	})
}, { passive: true });

for (const item in defaults) {
	let element = document.getElementById(item);
	switch (item) {
	case 'brightness':
		element.addEventListener('input', event => {
			chrome.storage.proxy.local.settings.set(item, parseFloat(event.target.value) || 0)
		}, { passive: true });
		break;
	case 'colorPalette':
		for (let element of document.querySelectorAll('[id^=' + item + ']:not([id$=-visible])')) {
			integrateLabelShortcut.call(element);
		}
		break;
	case 'style':
	case 'theme':
		for (const input of document.querySelectorAll("input[name='" + item + "']"))
			input.addEventListener('input', function() {
				chrome.storage.proxy.local.settings.set(item, this.id)
			}, { passive: true });
		break;
	default:
		element && element.type === 'checkbox' && element.addEventListener('change', ({ target }) => {
			chrome.storage.proxy.local.settings.set(target.id, target.checked)
		}, { passive: true })
	}
}

function setState(enabled) {
	state.classList[enabled ? 'add' : 'remove']('enabled');
	return enabled
}

function restoreSettings(data) {
	for (const item in data) {
		let element = document.getElementById(item);
		switch (item) {
		case 'colorPalette':
			for (let property in data[item]) {
				element = document.getElementById(item + '.' + property);
				element && (element.parentElement.style.setProperty('background-color', (element.value = data[item][property] || '#000000') + '33'),
				element.value !== '#000000' && (element = document.getElementById(item + '.' + property + '-visible')) && (element.checked = true));
			}
			break;
		case 'brightness':
			element.value = data[item];
			var name = element.parentElement.querySelector('.name');
			name.textContent = name.textContent.replace(/(?<=\()[\d\.]+(%)?(?=\))/, element.value + '$1');
			break;
		case 'style':
		case 'theme':
			(element = document.getElementById(data[item])) && (element.checked = true);
			break;
		default:
			element && element.type === 'checkbox' && (element.checked = data[item])
		}
	}
}

function integrateLabelShortcut() {
	this.parentElement.addEventListener('focusout', ({ target }) => target.removeAttribute('tabindex'), { passive: true }),
	this.addEventListener('click', event => {
		let t = event.target;
		if (t.parentElement.hasAttribute('tabindex')) {
			event.preventDefault();
			t.parentElement.removeAttribute('tabindex');
			return;
		}

		t.parentElement.setAttribute('tabindex', '0'),
		t.parentElement.focus()
	});
	let checkbox = this.parentElement.querySelector('input[type="checkbox"]');
	this.parentElement.addEventListener('contextmenu', event => {
		event.preventDefault();
		let object = chrome.storage.proxy.local.settings
		, subtree = this.id.split('.')
		, id = subtree.pop();
		while (subtree.length > 0) {
			object = object[subtree.shift()];
		}
		object.delete(id),
		checkbox.checked = !1
	}),
	this.addEventListener('input', ({ target }) => {
		let object = chrome.storage.proxy.local.settings
		, subtree = target.id.split('.')
		, id = subtree.pop();
		while (subtree.length > 0) {
			object = object[subtree.shift()];
		}
		object.set(id, target.value),
		checkbox.checked = !0
	}, { passive: true })
}