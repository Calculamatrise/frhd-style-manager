class ThirdPartyStyleManager extends EventTarget {
	#parent = null;
	colorScheme = null;
	preferredColorScheme = null;
	constructor(parent = null) {
		super();
		Object.defineProperty(parent, 'styles', {
			value: this,
			writable: true
		});
		this.#parent = parent;
		const colorScheme = matchMedia('(prefers-color-scheme: dark)');
		this._updatePreferredColorScheme(colorScheme);
		colorScheme.onchange = event => this._updatePreferredColorScheme(event.target)
	}

	_updatePreferredColorScheme(mediaQuery) {
		this.preferredColorScheme = mediaQuery.matches ? 'dark' : 'light';
		this.dispatchEvent(new CustomEvent('preferredColorSchemeChange', { detail: this.preferredColorScheme }))
	}
}

self.ThirdPartyStyleManager || Object.defineProperty(self, 'ThirdPartyStyleManager', {
	value: ThirdPartyStyleManager,
	writable: true
});

self.GameStyleManager || Object.defineProperty(self, 'GameStyleManager', {
	value: new ThirdPartyStyleManager(Application),
	writable: true
});