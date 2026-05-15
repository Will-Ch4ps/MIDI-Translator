import { useEffect, useMemo, useState } from "react";
import { inspectTarget, type TargetInspection } from "../../lib/audioBackend";

type State = {
  loading: boolean;
  inspection: TargetInspection | null;
};

const EMPTY: State = { loading: false, inspection: null };

export function useTargetInspection(actionType: string, value: string, volumeTarget: string): State {
  const [state, setState] = useState<State>(EMPTY);
  const targetValue = useMemo(() => {
    if (actionType === "volume_set" || actionType === "volume_up" || actionType === "volume_down") {
      return volumeTarget;
    }
    return value;
  }, [actionType, value, volumeTarget]);

  useEffect(() => {
    if (!needsInspection(actionType)) {
      setState(EMPTY);
      return;
    }
    const raw = (targetValue || "").trim();
    if (!raw) {
      setState(EMPTY);
      return;
    }
    setState((current) => ({ ...current, loading: true }));
    const timer = window.setTimeout(() => {
      inspectTarget(actionType, raw)
        .then((inspection) => setState({ loading: false, inspection }))
        .catch(() => setState({ loading: false, inspection: null }));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [actionType, targetValue]);

  return state;
}

function needsInspection(actionType: string) {
  return actionType === "app_launch"
    || actionType === "script"
    || actionType === "volume_set"
    || actionType === "volume_up"
    || actionType === "volume_down";
}

