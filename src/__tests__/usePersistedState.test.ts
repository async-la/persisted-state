import { renderHook, act } from "@testing-library/react-hooks";
import { usePersistedState } from "../web";

const k1 = "k1";
const v1 = "v1";
const v2 = "v2";
const v3 = "v3";

test("defaulting and setting values", () => {
  const { result } = renderHook(() => usePersistedState(k1, v1));
  // value is default and pending is false
  expect(result.current[0]).toEqual(v1);
  expect(result.current[2]).toEqual(false);

  const { result: result2 } = renderHook(() => usePersistedState(k1, v2));
  // since memory has not yet been explicitly set, value is default (v2)
  expect(result2.current[0]).toEqual(v2);

  act(() => {
    result2.current[1](v3);
  });
  expect(result2.current[0]).toEqual(v3);

  const { result: result3 } = renderHook(() => usePersistedState(k1, v2));
  // since memory has been explicitly set, value is still v3 (not default)
  expect(result3.current[0]).toEqual(v3);
});
