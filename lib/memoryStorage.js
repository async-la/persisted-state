class MemoryStorage {
    constructor() {
        this.store = {};
    }
    get length() {
        return Object.keys(this.store).length;
    }
    // noop just here to satisfy type
    key() {
        return '';
    }
    clear() {
        this.store = {};
    }
    getItem(key) {
        // default to null to match localStorage
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = value;
    }
    removeItem(key) {
        delete this.store[key];
    }
}
export default new MemoryStorage();
