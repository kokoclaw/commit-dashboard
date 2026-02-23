"use client";

import { useMemo, useState } from "react";

type ApiResponse = {
  owner: string;
  repo: string;
  since: string;
  total: number;
  byDay: Record<string, number>;
  commits: any[];
  error?: string;
  details?: string;
};

function last30Days(): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function Home() {
  const [owner, setOwner] = useState("kokoclaw");
  const [repo, setRepo] = useState("commit-dashboard");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const days = useMemo(() => last30Days(), []);
  const maxCount = useMemo(() => {
    if (!data) return 0;
    return Math.max(...days.map((d) => data.byDay?.[d] || 0), 0);
  }, [data, days]);

  async function load() {
    setLoading(true);
    setData(null);
    const res = await fetch(`/api/commits?owner=${owner}&repo=${repo}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        GitHub commit activity (last 30 days)
      </h1>

      <div style={{ display: "flex", gap: 12, alignItems: "end", marginBottom: 16 }}>
        <label>
          Owner
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            style={{ display: "block", padding: 8, width: 220 }}
          />
        </label>

        <label>
          Repo
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            style={{ display: "block", padding: 8, width: 220 }}
          />
        </label>

        <button onClick={load} disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {!data && !loading && <p>Enter a repo and click Load.</p>}

      {data?.error && (
        <pre style={{ background: "#111", color: "#eee", padding: 12, overflowX: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      {data && !data.error && (
        <>
          <p style={{ marginBottom: 12 }}>
            <strong>
              {data.owner}/{data.repo}
            </strong>{" "}
            – total commits returned: <strong>{data.total}</strong>
          </p>

          <div
            style={{
              display: "flex",
              gap: 2,
              alignItems: "flex-end",
              height: 120,
              marginBottom: 20,
            }}
          >
            {days.map((d) => {
              const c = data.byDay?.[d] || 0;
              const h = maxCount ? Math.round((c / maxCount) * 100) : 0;
              return (
                <div
                  key={d}
                  title={`${d}: ${c}`}
                  style={{
                    width: 10,
                    height: `${Math.max(h, 2)}%`,
                    background: "#444",
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Recent commits (sample)</h2>
          <ul style={{ lineHeight: 1.6 }}>
            {data.commits.map((c, idx) => (
              <li key={idx}>
                <a href={c.html_url} target="_blank" rel="noreferrer">
                  {c.commit?.message?.split("\n")[0] ?? "Commit"}
                </a>{" "}
                – {c.commit?.author?.date?.slice(0, 10)}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
