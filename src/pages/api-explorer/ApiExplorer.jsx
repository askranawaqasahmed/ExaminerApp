import React, { useEffect, useMemo, useState } from "react";
import SidebarNav from "@/components/swagger/SidebarNav";
import OperationRunner from "@/components/swagger/OperationRunner";
import useSwagger from "@/hooks/useSwagger";

const DEFAULT_SWAGGER_URL = "https://examiner.ideageek.pk/swagger/v1/swagger.json";
const METHOD_ORDER = {
  GET: 1,
  POST: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5,
  OPTIONS: 6,
  HEAD: 7,
};

const deriveBaseUrl = (spec) => {
  if (!spec) return "";
  if (spec.servers?.length && spec.servers[0].url) {
    return spec.servers[0].url.replace(/\/+$/, "");
  }
  if (spec.host) {
    const scheme = spec.schemes?.[0] || "https";
    const basePath = spec.basePath || "";
    return `${scheme}://${spec.host}${basePath}`;
  }
  return "";
};

const buildOperations = (spec) => {
  if (!spec?.paths) return [];
  const groups = new Map();
  let counter = 0;

  Object.entries(spec.paths).forEach(([pathKey, pathItem]) => {
    const pathLevelParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
    Object.entries(pathItem).forEach(([methodKey, opValue]) => {
      if (methodKey.toLowerCase() === "parameters") return;
      const method = methodKey.toUpperCase();
      if (!METHOD_ORDER[method]) return;

      counter += 1;
      const tags = opValue.tags?.length ? opValue.tags : ["general"];
      const parameters = [...pathLevelParams, ...(opValue.parameters || [])];
      const hasBody = Boolean(opValue.requestBody || parameters.some((param) => param.in === "body"));
      const tagName = tags[0] || "general";
      const baseOperation = {
        id: `${method}-${pathKey}-${opValue.operationId || counter}`,
        method,
        path: pathKey,
        summary: opValue.summary || opValue.operationId || pathKey,
        description: opValue.description,
        parameters,
        requestBody: opValue.requestBody,
        consumes: opValue.consumes || spec.consumes,
        produces: opValue.produces || spec.produces,
        hasBody,
      };

      const existing = groups.get(tagName) || { tag: tagName, operations: [] };
      existing.operations.push({ ...baseOperation, tag: tagName });
      groups.set(tagName, existing);
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      operations: group.operations.sort((a, b) => {
        if (a.path === b.path) return (METHOD_ORDER[a.method] || 99) - (METHOD_ORDER[b.method] || 99);
        return a.path.localeCompare(b.path);
      }),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
};

const ApiExplorer = () => {
  const [swaggerUrl, setSwaggerUrl] = useState(DEFAULT_SWAGGER_URL);
  const [swaggerInput, setSwaggerInput] = useState(DEFAULT_SWAGGER_URL);
  const [baseUrlOverride, setBaseUrlOverride] = useState("");
  const [token, setToken] = useState("");

  const { spec, loading, error, refetch } = useSwagger(swaggerUrl);

  const operationsByTag = useMemo(() => buildOperations(spec), [spec]);
  const flatOperations = useMemo(
    () => operationsByTag.reduce((all, group) => all.concat(group.operations), []),
    [operationsByTag]
  );

  const [activeOperationId, setActiveOperationId] = useState(null);

  useEffect(() => {
    if (flatOperations.length) {
      setActiveOperationId(flatOperations[0].id);
    } else {
      setActiveOperationId(null);
    }
  }, [flatOperations]);

  const activeOperation = useMemo(
    () => flatOperations.find((op) => op.id === activeOperationId),
    [flatOperations, activeOperationId]
  );

  const detectedBaseUrl = useMemo(() => deriveBaseUrl(spec), [spec]);
  const effectiveBaseUrl = baseUrlOverride || detectedBaseUrl;

  const handleReload = () => {
    const trimmed = swaggerInput.trim();
    if (!trimmed) return;
    if (trimmed !== swaggerUrl) {
      setSwaggerUrl(trimmed);
    } else {
      refetch();
    }
  };

  return (
    <div className="swagger-app">
      <header className="swagger-topbar">
        <div className="swagger-brand">
          <h1>Examiner API Console</h1>
          <p>Navigation and CRUD runner generated directly from your Swagger file.</p>
        </div>
        <div className="swagger-top-controls">
          <div className="swagger-field">
            <span className="swagger-field-label">Swagger URL</span>
            <div className="swagger-input-row">
              <input
                type="text"
                value={swaggerInput}
                onChange={(e) => setSwaggerInput(e.target.value)}
                placeholder="https://examiner.ideageek.pk/swagger/v1/swagger.json"
              />
              <button type="button" onClick={handleReload} disabled={loading}>
                {loading ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
          <div className="swagger-field">
            <span className="swagger-field-label">API Base URL</span>
            <input
              type="text"
              value={baseUrlOverride}
              onChange={(e) => setBaseUrlOverride(e.target.value)}
              placeholder={detectedBaseUrl || "Set manually if not in Swagger"}
            />
          </div>
          <div className="swagger-field">
            <span className="swagger-field-label">JWT token (optional)</span>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer token will be added as Authorization"
            />
          </div>
        </div>
      </header>

      <div className="swagger-body">
        <SidebarNav
          groups={operationsByTag}
          selectedOperationId={activeOperationId}
          onSelect={setActiveOperationId}
        />
        <main className="swagger-main">
          {loading && <div className="swagger-loading">Loading Swagger definition...</div>}
          {error && (
            <div className="swagger-error">
              Unable to load Swagger from <strong>{swaggerUrl}</strong>. {error.message}
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="swagger-base-meta">
                <div>
                  <span className="swagger-meta-key">Detected base URL</span>
                  <span className="swagger-meta-value">{detectedBaseUrl || "Not provided in Swagger"}</span>
                </div>
                <div>
                  <span className="swagger-meta-key">Operations</span>
                  <span className="swagger-meta-value">{flatOperations.length}</span>
                </div>
              </div>
              <OperationRunner operation={activeOperation} baseUrl={effectiveBaseUrl} token={token} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ApiExplorer;
