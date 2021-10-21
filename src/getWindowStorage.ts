import memoryStorage from './memoryStorage'

type StorageTypes = 'localStorage' | 'sessionStorage'
export function getWindowStorage(storageType: StorageTypes) {
  if (typeof self !== 'object' || !(storageType in self)) {
    return memoryStorage
  }

  try {
    let storage = self[storageType]
    const testKey = `redux-persist ${storageType} test`
    storage.setItem(testKey, 'test')
  } catch (e) {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`storage ${storageType} test failed, persistence will fallback to memory.`)
    return memoryStorage
  }
  return self[storageType]
}
