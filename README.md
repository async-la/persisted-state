# @async/persisted-state
This module is a little helper, primarily intended for use with react. A minimal persisted state libary that conforms to and extends  the useState api.

## Notes
1. Seamlessly supports async storage engines by returning pending as the last item in the return tuple. Value will be default until storage is resolved.
2. Seamlessly supports sync storage engines, in a single render pass.
3. Can use setPersistedState / getPersistedState directly if use is needed outside of hook
4. Optionally syncs cross-tab (if on web)

## Usage
```ts
// hook
let [theme, setTheme, themePending] = usePersistedState('theme-key', 'dark')

// getter
let theme = await getPersistedState('theme-key')
```
