/*
  Wrapper for localStorage that
  - defaults to memory storage if localStorage does not exist or cannot be used (private browser)
  */
import { getWindowStorage } from './getWindowStorage';
export default getWindowStorage('localStorage');
