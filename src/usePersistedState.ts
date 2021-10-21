import { useState, useMemo, useEffect, useCallback } from "react";
import Storage from "./storage";

type OnValueChange = (newValue: any) => void;
let localListeners: Map<string, Set<OnValueChange>> = new Map();

function storageSubcription(key: string, onValueChange: OnValueChange) {
  if (!localListeners.get(key)) {
    localListeners.set(key, new Set());
  }

  return () => {
    localListeners.get(key)?.add(onValueChange);

    // make sure we grab the latest value in case something was missed between mount and effect
    let currentValue = resolveCache(key);
    if (currentValue) onValueChange(currentValue);

    // cross tab support via storage change events (localStorage only)
    let listener = ({ key: k, newValue }: any) => {
      if (k === key) {
        onValueChange(newValue);
      }
    };
    typeof window !== "undefined" &&
      window.addEventListener("storage", listener);

    return () => {
      typeof window !== "undefined" &&
        window.removeEventListener("storage", listener);
      localListeners.get(key)?.delete(onValueChange);
    };
  };
}
export function storageObjectSubcription<S>(
  key: string,
  onValue: (newState: S | null) => void
) {
  return storageSubcription(key, (state: string) => {
    onValue(state === null ? null : JSON.parse(state));
  });
}

type CacheValue<S = string> = S | null | Promise<S | null>;
let memoryCache: { [key: string]: CacheValue } = {};

function resolveCache(key: string): CacheValue {
  let existing = memoryCache[key];
  let future = memoryCache[key] === undefined ? Storage.getItem(key) : existing;
  memoryCache[key] = future;

  // if future is a tbd promise
  if (typeof future === "object" && future?.then) {
    // once the promise resolvese update cache and listeners via setPersistedState
    future.then((value: string | null) => {
      // noop if the promise is no longer the current cached value (aka value has already been set)
      if (memoryCache[key] === future) setPersistedState(key, value);
    });
  }
  return memoryCache[key];
}
export function usePersistedState<S extends string | null>(
  key: string,
  defaultValue: S
): [S, (state: S) => void, boolean] {
  let [state, setState] = useState<S | null | Promise<S | null>>(
    resolveCache(key) as CacheValue<S | null>
  );
  // we need storageSubscription to run sync so we can pickup state changes
  // we need effect to handle cleanup when component unmounts
  useEffect(storageSubcription(key, setState));

  let setAndPersist = useCallback(
    (newState: S) => {
      setPersistedState(key, newState);
    },
    [key]
  );

  return typeof state === "object" && state?.then
    ? [defaultValue, setAndPersist, true]
    : [(state || defaultValue) as S, setAndPersist, false];
}

export function usePersistedObjectState<S extends object | null>(
  key: string,
  defaultValue: S
): [S, (state: S) => void, boolean] {
  let [serialState, setSerialState, pending] = usePersistedState<string | null>(
    key,
    null
  );

  let state = useMemo(() => {
    try {
      return serialState ? JSON.parse(serialState) : defaultValue;
    } catch (err) {
      setSerialState(null);
      if (process.env.NODE_ENV !== "production")
        console.error("failed to deserialize state", serialState, err);
      else return defaultValue;
    }
  }, [serialState, setSerialState, defaultValue]);

  let setAndPersist = useCallback(
    (newState: S) => {
      let newStateSerialized =
        newState === null ? null : JSON.stringify(newState);
      setSerialState(newStateSerialized);
    },
    [setSerialState]
  );
  return [state, setAndPersist, pending];
}

export function getPersistedState(key: string) {
  return resolveCache(key);
}

export async function getPersistedObjectState(key: string) {
  return JSON.parse((await Storage.getItem(key)) || "null");
}

export function setPersistedState(key: string, newState: string | null) {
  memoryCache[key] = newState;
  localListeners.get(key)?.forEach((l) => l(newState));
  return newState !== null
    ? Storage.setItem(key, newState)
    : Storage.removeItem(key);
}

export async function setPersistedObjectState(
  key: string,
  newState: object | null
) {
  return setPersistedState(
    key,
    newState === null ? null : JSON.stringify(newState)
  );
}

export function clearPersistKey(persistKey: string) {
  localStorage.removeItem(persistKey);
}
