import { useCallback, useEffect, useState } from "react";

const useSwagger = (swaggerUrl) => {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSpec = useCallback(() => {
    if (!swaggerUrl) {
      setError(new Error("Swagger URL is missing"));
      setSpec(null);
      return null;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(swaggerUrl, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load Swagger (${res.status})`);
        }
        const json = await res.json();
        setSpec(json);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err);
        setSpec(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return controller;
  }, [swaggerUrl]);

  useEffect(() => {
    const controller = fetchSpec();
    return () => controller?.abort();
  }, [fetchSpec]);

  return { spec, loading, error, refetch: fetchSpec };
};

export default useSwagger;
