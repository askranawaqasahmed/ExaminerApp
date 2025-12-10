import React, { useEffect, useMemo, useState } from "react";
import { buildUrl, createApiClient } from "@/utils/apiClient";

const methodLabel = (method) => method?.toUpperCase();

const splitParams = (parameters = []) => {
  const path = [];
  const query = [];
  const header = [];
  const body = [];

  parameters.forEach((param) => {
    if (!param?.in) return;
    const location = param.in.toLowerCase();
    if (location === "path") path.push(param);
    if (location === "query") query.push(param);
    if (location === "header") header.push(param);
    if (location === "body") body.push(param);
  });

  return { path, query, header, body };
};

const pickExample = (source) => {
  if (!source) return undefined;
  if (source.example !== undefined) return source.example;
  if (source.examples) {
    const firstExample = Object.values(source.examples)[0];
    if (firstExample?.value !== undefined) return firstExample.value;
  }
  if (source.schema) {
    if (source.schema.example !== undefined) return source.schema.example;
    if (source.schema.default !== undefined) return source.schema.default;
  }
  if (source.default !== undefined) return source.default;
  return undefined;
};

const formatExample = (example) => {
  if (example === undefined) return "";
  if (typeof example === "string") return example;
  try {
    return JSON.stringify(example, null, 2);
  } catch (err) {
    return "";
  }
};

const getDefaultBody = (operation) => {
  if (!operation) return "";

  const requestContent = operation.requestBody?.content;
  if (requestContent && typeof requestContent === "object") {
    const firstType = Object.keys(requestContent)[0];
    const example = pickExample(requestContent[firstType]);
    if (example !== undefined) return formatExample(example);
  }

  const bodyParam = (operation.parameters || []).find((param) => param.in === "body");
  if (bodyParam) {
    const example = pickExample(bodyParam) ?? pickExample(bodyParam.schema);
    if (example !== undefined) return formatExample(example);
  }

  return "";
};

const getInitialParams = (parameters = []) => {
  const values = {};
  parameters.forEach((param) => {
    if (!param?.name) return;
    const initial =
      param.example ??
      param.default ??
      param.schema?.example ??
      param.schema?.default ??
      param.schema?.pattern ??
      "";
    values[param.name] = initial ?? "";
  });
  return values;
};

const resolvePathPlaceholders = (path = "", params = {}) => {
  return path.replace(/{(.*?)}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : encodeURIComponent(value);
  });
};

const getContentTypes = (operation) => {
  if (!operation) return ["application/json"];
  if (operation.requestBody?.content) return Object.keys(operation.requestBody.content);
  if (Array.isArray(operation.consumes) && operation.consumes.length) return operation.consumes;
  return ["application/json"];
};

const getAcceptTypes = (operation) => {
  if (Array.isArray(operation?.produces) && operation.produces.length) return operation.produces;
  return ["application/json"];
};

const formatResponsePayload = (response) => {
  if (!response) return "";
  if (response.data === null || response.data === undefined) return response.rawText || "";
  if (typeof response.data === "string") return response.data;
  try {
    return JSON.stringify(response.data, null, 2);
  } catch (err) {
    return String(response.data);
  }
};

const OperationRunner = ({ operation, baseUrl, token }) => {
  const [paramValues, setParamValues] = useState({});
  const [bodyText, setBodyText] = useState("");
  const [contentType, setContentType] = useState("application/json");
  const [acceptType, setAcceptType] = useState("application/json");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const parameterSets = useMemo(() => splitParams(operation?.parameters || []), [operation]);
  const contentTypes = useMemo(() => getContentTypes(operation), [operation]);
  const acceptTypes = useMemo(() => getAcceptTypes(operation), [operation]);

  useEffect(() => {
    setParamValues(getInitialParams(operation?.parameters));
    setBodyText(getDefaultBody(operation));
    setContentType(contentTypes[0] || "application/json");
    setAcceptType(acceptTypes[0] || "application/json");
    setResponse(null);
    setError(null);
  }, [operation, contentTypes, acceptTypes]);

  const resolvedOpPath = (operation?.path || "").toLowerCase();
  const shouldSkipToken = resolvedOpPath.includes("/auth/login");
  const client = useMemo(
    () =>
      createApiClient({
        baseUrl,
        getToken: () => {
          if (shouldSkipToken) return undefined;
          return token;
        },
      }),
    [baseUrl, token, shouldSkipToken]
  );

  const handleParamChange = (name, value) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const queryObject = useMemo(() => {
    const query = {};
    parameterSets.query.forEach((param) => {
      const value = paramValues[param.name];
      if (value !== undefined && value !== null && value !== "") {
        query[param.name] = value;
      }
    });
    return query;
  }, [paramValues, parameterSets.query]);

  const resolvedPath = useMemo(
    () => resolvePathPlaceholders(operation?.path || "", paramValues),
    [operation?.path, paramValues]
  );

  const requestPreview = useMemo(() => {
    try {
      return buildUrl(baseUrl, resolvedPath || operation?.path || "", queryObject);
    } catch (err) {
      return resolvedPath || operation?.path || "";
    }
  }, [baseUrl, resolvedPath, operation?.path, queryObject]);

  const sendRequest = async () => {
    if (!operation) return;
    if (!baseUrl && !operation.path.startsWith("http")) {
      setError("Set a base URL or override it to run this request.");
      return;
    }

    const headers = {};
    parameterSets.header.forEach((param) => {
      const value = paramValues[param.name];
      if (value !== undefined && value !== null && value !== "") {
        headers[param.name] = value;
      }
    });

    if (acceptType) {
      headers.Accept = acceptType;
    }

    let payload;
    if (operation.hasBody) {
      if (contentType) {
        headers["Content-Type"] = contentType;
      }

      if (contentType?.includes("json")) {
        try {
          payload = bodyText ? JSON.parse(bodyText) : {};
        } catch (err) {
          setError("Request body is not valid JSON.");
          return;
        }
      } else {
        payload = bodyText;
      }
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await client({
        path: resolvedPath || operation.path,
        method: operation.method,
        query: queryObject,
        headers,
        body: payload,
      });
      setResponse(result);
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setIsSending(false);
    }
  };

  if (!operation) {
    return <div className="swagger-empty">Select an operation to see details.</div>;
  }

  return (
    <div className="swagger-operation">
      <div className="swagger-operation-head">
        <div className="swagger-operation-meta">
          <span className={`swagger-method method-${operation.method.toLowerCase()}`}>
            {methodLabel(operation.method)}
          </span>
          <span className="swagger-operation-path">{operation.path}</span>
        </div>
        <button type="button" className="swagger-send-btn" onClick={sendRequest} disabled={isSending}>
          {isSending ? "Sending..." : "Send request"}
        </button>
      </div>

      <div className="swagger-operation-summary">{operation.summary}</div>
      {operation.description && <p className="swagger-operation-description">{operation.description}</p>}

      <div className="swagger-section">
        <h4>Parameters</h4>
        <div className="swagger-param-grid">
          {["path", "query", "header"].map((location) =>
            parameterSets[location].map((param) => (
              <div className="swagger-param" key={`${location}-${param.name}`}>
                <label className="swagger-field">
                  <span className="swagger-field-label">
                    {param.name} <span className="swagger-param-loc">({location})</span>
                    {param.required && <span className="swagger-required">*</span>}
                  </span>
                  <input
                    type="text"
                    value={paramValues[param.name] ?? ""}
                    placeholder={param.description || param.schema?.type || ""}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                  />
                </label>
                {param.description && <div className="swagger-help">{param.description}</div>}
              </div>
            ))
          )}
          {parameterSets.path.length === 0 &&
            parameterSets.query.length === 0 &&
            parameterSets.header.length === 0 && <div className="swagger-empty">No parameters for this operation.</div>}
        </div>
      </div>

      {operation.hasBody && (
        <div className="swagger-section">
          <div className="swagger-field inline">
            <label>
              <span className="swagger-field-label">Content Type</span>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {contentTypes.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="swagger-field">
            <span className="swagger-field-label">Request Body</span>
            <textarea
              rows={10}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Provide JSON or raw payload"
            />
          </div>
        </div>
      )}

      <div className="swagger-section compact">
        <h4>Headers</h4>
        <div className="swagger-field inline">
          <label>
            <span className="swagger-field-label">Accept</span>
            <select value={acceptType} onChange={(e) => setAcceptType(e.target.value)}>
              {acceptTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="swagger-meta">
          <span className="swagger-meta-key">Request URL</span>
          <span className="swagger-meta-value">{requestPreview}</span>
        </div>
      </div>

      <div className="swagger-response-area">
        {error && <div className="swagger-error">{error}</div>}
        {response && (
          <div className="swagger-response-card">
            <div className="swagger-response-head">
              <div>
                <div className="swagger-response-label">Status</div>
                <div className="swagger-response-status">
                  {response.status} {response.statusText}
                </div>
              </div>
              <div className="swagger-response-url">{response.url}</div>
            </div>
            <div className="swagger-response-body">
              <div className="swagger-response-label">Response</div>
              <pre className="swagger-code">{formatResponsePayload(response)}</pre>
            </div>
            {response.headers && (
              <div className="swagger-response-headers">
                <div className="swagger-response-label">Headers</div>
                <div className="swagger-headers-grid">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="swagger-header-row">
                      <span className="swagger-header-key">{key}</span>
                      <span className="swagger-header-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!response && !error && <div className="swagger-help">Fill any parameters and hit "Send request" to run CRUD actions.</div>}
      </div>
    </div>
  );
};

export default OperationRunner;
