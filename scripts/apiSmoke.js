#!/usr/bin/env node
/**
 * Lightweight API smoke test for ExaminerApp.
 *
 * Usage:
 *   API_BASE=https://examiner.ideageek.pk \
 *   API_USERNAME=superadmin@examiner.com \
 *   API_PASSWORD=SuperAdmin@123 \
 *   node scripts/apiSmoke.js
 */

const baseUrl = process.env.API_BASE || "https://examiner.ideageek.pk";
const username = process.env.API_USERNAME || "superadmin@examiner.com";
const password = process.env.API_PASSWORD || "SuperAdmin@123";

const fetchJson = async (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const res = await fetch(url, options);
  const bodyText = await res.text();
  let json;
  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch (err) {
    throw new Error(`Non-JSON response from ${url}: ${bodyText}`);
  }
  return { res, json };
};

const assertEnvelope = (json, label) => {
  if (!json || typeof json !== "object") throw new Error(`${label}: missing/invalid JSON body`);
  const { code, date, error, message, value } = json;
  if (code !== 200 || error === true) throw new Error(`${label}: unexpected status in envelope (${code}, error=${error})`);
  if (typeof message !== "string") throw new Error(`${label}: missing message`);
  if (!date) throw new Error(`${label}: missing date`);
  return value;
};

const login = async () => {
  const { res, json } = await fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  const value = assertEnvelope(json, "login");
  const token =
    value?.token ||
    value?.accessToken ||
    value?.access_token ||
    value?.data?.token ||
    value?.data?.accessToken ||
    value?.data?.access_token;
  if (!token) throw new Error("Login response missing token");
  return { token, user: value?.user };
};

const main = async () => {
  console.log(`Running API smoke against ${baseUrl}`);
  const { token, user } = await login();
  console.log(`Authenticated as ${user?.username || "unknown user"}`);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const { res: examsRes, json: examsJson } = await fetchJson("/api/exams", { headers: authHeaders });
  if (!examsRes.ok) throw new Error(`Exams failed: HTTP ${examsRes.status}`);
  const exams = assertEnvelope(examsJson, "exams");
  if (!Array.isArray(exams)) throw new Error("Exams payload is not an array");
  console.log(`Loaded ${exams.length} exams`);

  const sampleExams = exams.slice(0, 2);
  for (const exam of sampleExams) {
    const examId = exam.id || exam.examId;
    if (!examId) continue;
    const label = exam.name || examId;
    const { res, json } = await fetchJson(`/api/questions/by-exam/${examId}`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Questions for ${label} failed: HTTP ${res.status}`);
    const questions = assertEnvelope(json, `questions(${label})`);
    const typeCounts = questions.reduce(
      (acc, q) => {
        const t = q?.type ?? "unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      {}
    );
    console.log(
      `Questions for "${label}": ${questions.length} total (types: ${Object.entries(typeCounts)
        .map(([t, count]) => `${t}:${count}`)
        .join(", ")})`
    );
  }

  console.log("Smoke test finished without envelope errors.");
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
