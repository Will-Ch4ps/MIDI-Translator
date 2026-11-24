/** Estado central: dados do backend, vínculos, listener e estado ao vivo do teclado. */
import { useCallback, useEffect, useReducer, useState } from "react";
import { bridge, errorText } from "../lib/bridge";
import type { Action, Bootstrap, Mapping, Profile } from "../lib/types";
import { initialMidi, midiReducer } from "./midi";
import { useListener } from "./useListener";

export function useApp() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [midi, dispatch] = useReducer(midiReducer, initialMidi);
  const listener = useListener(data, dispatch, setError);

  useEffect(() => {
    bridge.bootstrap().then(setData).catch((err) => setError(errorText(err)));
  }, []);

  const applyProfile = async (task: () => Promise<Profile>) => {
    try {
      const profile = await task();
      setData((current) => (current ? { ...current, profile } : current));
      await listener.reloadIfRunning();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    }
  };

  const profileName = data?.profile.name ?? "default";

  return {
    data,
    error,
    clearError: useCallback(() => setError(""), []),
    midi,
    listener,
    saveMapping: (mapping: Mapping) => applyProfile(() => bridge.saveMapping(profileName, mapping)),
    deleteMapping: (controlId: string, trigger: string) =>
      applyProfile(() => bridge.deleteMapping(profileName, controlId, trigger)),
    testAction: async (action: Action, continuous: boolean) => {
      try {
        await bridge.testAction(action, continuous);
        return true;
      } catch (err) {
        setError(errorText(err));
        return false;
      }
    },
  };
}

export type AppState = ReturnType<typeof useApp>;
