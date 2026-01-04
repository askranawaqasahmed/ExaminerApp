const hasProtocol = (value = "") => /^https?:\/\//i.test(value);

export const buildUrl = (baseUrl = "", path = "", query) => {
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
  const cleanPath = path ? path.replace(/^\//, "") : "";

  if (!hasProtocol(path) && !cleanBase) {
    throw new Error("Base URL is missing; unable to build request URL.");
  }

  const rawUrl = hasProtocol(path) ? path : `${cleanBase}/${cleanPath}`;
  const url = new URL(rawUrl);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

export const createApiClient = ({ baseUrl = "", getToken, tokenPrefix = "Bearer" } = {}) => {
  const normalizedBase = baseUrl?.replace(/\/+$/, "");

  return async function request({
    path = "",
    method = "GET",
    query,
    body,
    headers = {},
    signal,
    skipToken = false,
  } = {}) {
    const upperMethod = method.toUpperCase();
    const token = typeof getToken === "function" ? getToken() : getToken;
    const targetUrl = buildUrl(normalizedBase, path, query);

    const finalHeaders = {
      Accept: "application/json",
      ...headers,
    };

    if (token && !skipToken) {
      const prefix = tokenPrefix === false ? "" : tokenPrefix ? `${tokenPrefix} ` : "";
      finalHeaders.Authorization = `${prefix}${token}`;
    }

    const init = {
      method: upperMethod,
      headers: finalHeaders,
      signal,
    };

    const methodAllowsBody = upperMethod !== "GET" && upperMethod !== "HEAD";
    if (methodAllowsBody && body !== undefined && body !== null) {
      const providedContentType = finalHeaders["Content-Type"] || finalHeaders["content-type"];
      const shouldStringify = !(body instanceof FormData);

      if (!providedContentType && shouldStringify && typeof body === "object") {
        finalHeaders["Content-Type"] = "application/json";
      }

      if (shouldStringify && typeof body === "object" && finalHeaders["Content-Type"]?.includes("json")) {
        init.body = JSON.stringify(body);
      } else if (shouldStringify && typeof body === "object") {
        init.body = JSON.stringify(body);
      } else {
        init.body = body;
      }
    }

    const response = await fetch(targetUrl, init);
    const rawText = await response.text();
    let data;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (err) {
      data = rawText;
    }

    const normalizedValue = data?.value ?? data?.data ?? data;
    const normalizedCount =
      typeof data?.count === "number" ? data.count : Array.isArray(normalizedValue) ? normalizedValue.length : undefined;
    const normalizedMessage = data?.message ?? data?.Message ?? response.statusText ?? "";
    const normalizedError = data?.error;
    const success = response.ok && normalizedError !== true;

    return {
      ok: response.ok,
      success,
      status: response.status,
      statusText: response.statusText,
      data,
      value: normalizedValue,
      count: normalizedCount,
      message: normalizedMessage,
      error: normalizedError,
      code: data?.code,
      rawText,
      headers: Object.fromEntries(response.headers.entries()),
      url: targetUrl,
      method: upperMethod,
    };
  };
};
