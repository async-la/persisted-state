import { useState, useMemo, useEffect, useCallback } from "react";

type OnValueChange = (newValue: any) => void;
let localListeners: Map<string, Set<OnValueChange>> = new Map();

export default function createPersistedState<S extends unknown | null | string>(
  storage: Storage,
  storageSync?: (key: string, onValueChange: OnValueChange) => () => void
) {
  let memoryCache: { [key: string]: S | Promise<S> } = {};

  function resolveCache(key: string): S | Promise<S> {
    let existing = memoryCache[key];
    let future = (
      memoryCache[key] === undefined ? storage.getItem(key) : existing
    ) as S | Promise<S>;
    memoryCache[key] = future;

    // if future is a tbd promise
    if (typeof future === "object" && (future as Promise<S>)?.then) {
      // once the promise resolvese update cache and listeners via setPersistedState
      (future as Promise<S>).then((value: S) => {
        // noop if the promise is no longer the current cached value (aka value has already been set)
        if (memoryCache[key] === future) setPersistedState(key, value);
      });
    }
    return memoryCache[key];
  }

  function storageSubcription(key: string, onValueChange: OnValueChange) {
    if (!localListeners.get(key)) {
      localListeners.set(key, new Set());
    }

    return () => {
      localListeners.get(key)?.add(onValueChange);

      // make sure we grab the latest value in case something was missed between mount and effect
      let currentValue = resolveCache(key);
      if (currentValue) onValueChange(currentValue);

      let storageSyncCleanup = storageSync?.(key, onValueChange);

      return () => {
        storageSyncCleanup;
        localListeners.get(key)?.delete(onValueChange);
      };
    };
  }

  function storageObjectSubcription<S>(
    key: string,
    onValue: (newState: S) => void
  ) {
    return storageSubcription(key, (state: string) => {
      onValue(state === null ? null : JSON.parse(state));
    });
  }

  function usePersistedState(
    key: string,
    defaultValue: S
  ): [S, (state: S) => void, boolean] {
    let [state, setState] = useState<S | Promise<S>>(resolveCache(key));
    // we need storageSubscription to run sync so we can pickup state changes
    // we need effect to handle cleanup when component unmounts
    useEffect(storageSubcription(key, setState));

    let setAndPersist = useCallback(
      (newState: S) => {
        setPersistedState(key, newState);
      },
      [key]
    );

    return typeof state === "object" && (state as Promise<S>)?.then
      ? [defaultValue, setAndPersist, true]
      : [(state || defaultValue) as S, setAndPersist, false];
  }

  function usePersistedObjectState<OS>(
    key: string,
    defaultValue: OS
  ): [OS, (state: OS) => void, boolean] {
    let [serialState, setSerialState, pending] = usePersistedState(
      key,
      null as S
    );

    let state = useMemo(() => {
      try {
        return serialState ? JSON.parse(serialState as string) : defaultValue;
      } catch (err) {
        setSerialState(null as S);
        if (process.env.NODE_ENV !== "production")
          console.error("failed to deserialize state", serialState, err);
        else return defaultValue;
      }
    }, [serialState, setSerialState, defaultValue]);

    let setAndPersist = useCallback(
      (newState: OS) => {
        let newStateSerialized =
          newState === null ? null : JSON.stringify(newState);
        setSerialState(newStateSerialized as S);
      },
      [setSerialState]
    );
    return [state, setAndPersist, pending];
  }

  function getPersistedState(key: string) {
    return resolveCache(key);
  }

  async function getPersistedObjectState(key: string) {
    return JSON.parse((await storage.getItem(key)) || "null");
  }

  function setPersistedState(key: string, newState: S) {
    memoryCache[key] = newState;

    // if we are setting a promise, resolveCache will handle the subscriptions, return early
    if (typeof newState === "object" && (newState as Promise<S>)?.then) {
      return resolveCache(key);
    }

    localListeners.get(key)?.forEach((l) => l(newState));
    return newState !== null
      ? storage.setItem(key, newState as string)
      : storage.removeItem(key);
  }

  async function setPersistedObjectState(key: string, newState: object | null) {
    return setPersistedState(
      key,
      (newState === null ? null : JSON.stringify(newState)) as S
    );
  }

  function clearPersistKey(persistKey: string) {
    localStorage.removeItem(persistKey);
  }

  return {
    usePersistedState,
    usePersistedObjectState,
    setPersistedState,
    setPersistedObjectState,
    getPersistedState,
    getPersistedObjectState,
    clearPersistKey,
    storageObjectSubcription,
  };
}
