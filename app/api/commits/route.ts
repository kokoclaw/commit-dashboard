import { NextResponse } from "next/server";
import { fetchCommitsLast30Days } from "@/lib/github";

function last30DaysKeys(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 29; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    days.push(x.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const owner = searchParams.get("owner") || "kokoclaw";
  const repo = searchParams.get("repo") || "commit-dashboard";

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing GITHUB_TOKEN" }, { status: 500 });
  }

  try {
    const commits = await fetchCommitsLast30Days(owner, repo, token);

    const days = last30DaysKeys();
    const byDay: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));

    for (const c of commits) {
      const day = c?.commit?.author?.date?.slice(0, 10);
      if (!day) continue;
      if (day in byDay) byDay[day] += 1;
    }

    let mostActiveDay = { date: days[0], count: byDay[days[0]] };
    for (const d of days) {
      if (byDay[d] > mostActiveDay.count) mostActiveDay = { date: d, count: byDay[d] };
    }

    const totalCommits = commits.length;
    const avgPerDay = Math.round((totalCommits / 30) * 10) / 10;

    return NextResponse.json({
      owner,
      repo,
      since: days[0],
      totalCommits,
      avgPerDay,
      mostActiveDay,
      byDay,
      commitsSample: commits.slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch commits", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
