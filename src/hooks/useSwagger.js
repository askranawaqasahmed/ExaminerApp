import { useCallback, useEffect, useMemo, useState } from "react";

const defaultProxyFns = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const useSwagger = (swaggerUrl, { useProxy = false, customProxyFn } = {}) => {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proxyUsed, setProxyUsed] = useState(null);

  const proxyCandidates = useMemo(() => {
    if (!useProxy) return [];
    const fns = [];
    if (typeof customProxyFn === "function") fns.push(customProxyFn);
    fns.push(...defaultProxyFns);
    return fns;
  }, [useProxy, customProxyFn]);

  const fetchSpec = useCallback(() => {
    if (!swaggerUrl) {
      setError(new Error("Swagger URL is missing"));
      setSpec(null);
      setProxyUsed(null);
      return null;
    }

    const controller = new AbortController();
    const attemptUrls = [swaggerUrl, ...proxyCandidates.map((fn) => fn(swaggerUrl))];

    setLoading(true);
    setError(null);
    setProxyUsed(null);

    (async () => {
      for (let i = 0; i < attemptUrls.length; i++) {
        const candidate = attemptUrls[i];
        const isProxy = i > 0;
        try {
          const res = await fetch(candidate, { signal: controller.signal });
          if (!res.ok) {
            throw new Error(`Failed to load Swagger (${res.status}) from ${candidate}`);
          }
          const json = await res.json();
          setSpec(json);
          setProxyUsed(isProxy ? candidate : null);
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
          if (i === attemptUrls.length - 1) {
            setError(err);
            setSpec(null);
            setProxyUsed(isProxy ? candidate : null);
          }
        }
      }
    })().finally(() => setLoading(false));

    return controller;
  }, [swaggerUrl, proxyCandidates]);

  useEffect(() => {
    const controller = fetchSpec();
    return () => controller?.abort();
  }, [fetchSpec]);

  return { spec, loading, error, refetch: fetchSpec, proxyUsed };
};

export default useSwagger;
