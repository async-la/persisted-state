class MemoryStorage {
  store: { [key: string]: string } = {}

  get length() {
    return Object.keys(this.store).length
  }

  // noop just here to satisfy type
  key() {
    return ''
  }

  clear() {
    this.store = {}
  }
  getItem(key: string) {
    // default to null to match localStorage
    return this.store[key] || null
  }
  setItem(key: string, value: string) {
    this.store[key] = value
  }
  removeItem(key: string) {
    delete this.store[key]
  }
}

export default new MemoryStorage() as Storage
