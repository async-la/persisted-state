import createPersistedState from "./createPersistedState";
import { getWindowStorage } from "./getWindowStorage";

let storageSync = (key: string, onValueChange: (value: string) => void) => {
  // cross tab support via storage change events (localStorage only)
  let listener = ({ key: k, newValue }: any) => {
    if (k === key) {
      onValueChange(newValue);
    }
  };
  typeof window !== "undefined" && window.addEventListener("storage", listener);

  return () => {
    typeof window !== "undefined" &&
      window.removeEventListener("storage", listener);
  };
};

let {
  usePersistedState,
  usePersistedObjectState,
  setPersistedState,
  setPersistedObjectState,
  getPersistedState,
  getPersistedObjectState,
  clearPersistKey,
  storageObjectSubcription,
} = createPersistedState<string | null>(
  getWindowStorage("localStorage"),
  storageSync
);

export {
  usePersistedState,
  usePersistedObjectState,
  setPersistedState,
  setPersistedObjectState,
  getPersistedState,
  getPersistedObjectState,
  clearPersistKey,
  storageObjectSubcription,
};
