import { NextResponse } from "next/server";

function thirtyDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const owner = searchParams.get("owner") || "kokoclaw";
  const repo = searchParams.get("repo") || "commit-dashboard";

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing GITHUB_TOKEN" }, { status: 500 });
  }

  const since = thirtyDaysAgoISO();
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(
    since
  )}&per_page=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "GitHub API error", status: res.status, details: text },
      { status: 500 }
    );
  }

  const commits = await res.json();

  const byDay: Record<string, number> = {};
  for (const c of commits) {
    const day = c?.commit?.author?.date?.slice(0, 10);
    if (!day) continue;
    byDay[day] = (byDay[day] || 0) + 1;
  }

  return NextResponse.json({
    owner,
    repo,
    since,
    total: commits.length,
    byDay,
    commits: commits.slice(0, 20),
  });
}
