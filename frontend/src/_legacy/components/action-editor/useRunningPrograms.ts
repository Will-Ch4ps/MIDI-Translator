import { useCallback, useEffect, useState } from "react";
import { listRunningPrograms, type RunningProgram } from "../../lib/programBackend";

type State = {
  apps: RunningProgram[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useRunningPrograms(enabled: boolean): State {
  const [apps, setApps] = useState<RunningProgram[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      setApps(await listRunningPrograms());
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return { apps, loading, refresh };
}
