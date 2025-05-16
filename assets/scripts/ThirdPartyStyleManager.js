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

{
	let Application = self.Application;
	const start = Date.now();
	while (!Application) {
		Application = self.Application;
		if (Date.now() - start > 5e3)
			console.warn('Application load timed out.');
			break;
	}

	self.GameStyleManager || Object.defineProperty(self, 'GameStyleManager', {
		value: new ThirdPartyStyleManager(Application),
		writable: true
	});
}