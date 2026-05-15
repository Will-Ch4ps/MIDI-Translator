import { useCallback, useEffect, useState } from "react";
import { listAudioTargetCatalog, type AudioTargetApp } from "../../lib/audioBackend";

type State = {
  targets: string[];
  apps: AudioTargetApp[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_TARGETS = ["master", "lol", "browser", "youtube", "discord", "spotify", "obs"];

export function useAudioTargets(enabled: boolean): State {
  const [targets, setTargets] = useState<string[]>(DEFAULT_TARGETS);
  const [apps, setApps] = useState<AudioTargetApp[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const catalog = await listAudioTargetCatalog();
      const merged = Array.from(new Set([...DEFAULT_TARGETS, ...(catalog.targets || [])]));
      setTargets(merged);
      setApps(catalog.apps || []);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return { targets, apps, loading, refresh };
}

