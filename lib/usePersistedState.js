var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useMemo, useEffect, useCallback } from "react";
import Storage from "./storage";
let localListeners = new Map();
function storageSubcription(key, onValueChange) {
    if (!localListeners.get(key)) {
        localListeners.set(key, new Set());
    }
    return () => {
        var _a;
        (_a = localListeners.get(key)) === null || _a === void 0 ? void 0 : _a.add(onValueChange);
        // make sure we grab the latest value in case something was missed between mount and effect
        let currentValue = resolveCache(key);
        if (currentValue)
            onValueChange(currentValue);
        // cross tab support via storage change events (localStorage only)
        let listener = ({ key: k, newValue }) => {
            if (k === key) {
                onValueChange(newValue);
            }
        };
        typeof window !== "undefined" &&
            window.addEventListener("storage", listener);
        return () => {
            var _a;
            typeof window !== "undefined" &&
                window.removeEventListener("storage", listener);
            (_a = localListeners.get(key)) === null || _a === void 0 ? void 0 : _a.delete(onValueChange);
        };
    };
}
export function storageObjectSubcription(key, onValue) {
    return storageSubcription(key, (state) => {
        onValue(state === null ? null : JSON.parse(state));
    });
}
let memoryCache = {};
function resolveCache(key) {
    let existing = memoryCache[key];
    let future = memoryCache[key] === undefined ? Storage.getItem(key) : existing;
    memoryCache[key] = future;
    // if future is a tbd promise
    if (typeof future === "object" && (future === null || future === void 0 ? void 0 : future.then)) {
        // once the promise resolvese update cache and listeners via setPersistedState
        future.then((value) => {
            // noop if the promise is no longer the current cached value (aka value has already been set)
            if (memoryCache[key] === future)
                setPersistedState(key, value);
        });
    }
    return memoryCache[key];
}
export function usePersistedState(key, defaultValue) {
    let [state, setState] = useState(resolveCache(key));
    // we need storageSubscription to run sync so we can pickup state changes
    // we need effect to handle cleanup when component unmounts
    useEffect(storageSubcription(key, setState));
    let setAndPersist = useCallback((newState) => {
        setPersistedState(key, newState);
    }, [key]);
    return typeof state === "object" && (state === null || state === void 0 ? void 0 : state.then)
        ? [defaultValue, setAndPersist, true]
        : [(state || defaultValue), setAndPersist, false];
}
export function usePersistedObjectState(key, defaultValue) {
    let [serialState, setSerialState, pending] = usePersistedState(key, null);
    let state = useMemo(() => {
        try {
            return serialState ? JSON.parse(serialState) : defaultValue;
        }
        catch (err) {
            setSerialState(null);
            if (process.env.NODE_ENV !== "production")
                console.error("failed to deserialize state", serialState, err);
            else
                return defaultValue;
        }
    }, [serialState, setSerialState, defaultValue]);
    let setAndPersist = useCallback((newState) => {
        let newStateSerialized = newState === null ? null : JSON.stringify(newState);
        setSerialState(newStateSerialized);
    }, [setSerialState]);
    return [state, setAndPersist, pending];
}
export function getPersistedState(key) {
    return resolveCache(key);
}
export function getPersistedObjectState(key) {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse((yield Storage.getItem(key)) || "null");
    });
}
export function setPersistedState(key, newState) {
    var _a;
    memoryCache[key] = newState;
    (_a = localListeners.get(key)) === null || _a === void 0 ? void 0 : _a.forEach((l) => l(newState));
    return newState !== null
        ? Storage.setItem(key, newState)
        : Storage.removeItem(key);
}
export function setPersistedObjectState(key, newState) {
    return __awaiter(this, void 0, void 0, function* () {
        return setPersistedState(key, newState === null ? null : JSON.stringify(newState));
    });
}
export function clearPersistKey(persistKey) {
    localStorage.removeItem(persistKey);
}
