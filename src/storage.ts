/*
  Wrapper for localStorage that
  - defaults to memory storage if localStorage does not exist or cannot be used (private browser)
  */

import { getWindowStorage } from './getWindowStorage'

type AsyncStorage = {
  getItem: (key: string) => Promise<string>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}
export default getWindowStorage('localStorage') as Storage | AsyncStorage
