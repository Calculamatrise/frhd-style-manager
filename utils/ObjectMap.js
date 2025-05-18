export default class {
	constructor(object = null) {
		if (typeof object != 'object')
			throw new TypeError("object not iterable");
		Object.assign(this, object)
	}
	has(key) { return key in this }
	get(key) { return this[key] ?? null }
	set(key, value) {
		if (typeof key != 'string' && typeof key != 'number')
			throw new TypeError("Key must be of type string.");
		this[key] = value
	}
	delete(key) { return this.has(key) && delete this[key] }
}