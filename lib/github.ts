type GitHubCommit = any;

function thirtyDaysAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export async function fetchCommitsLast30Days(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubCommit[]> {
  const since = thirtyDaysAgoISO();
  const perPage = 100;

  const all: GitHubCommit[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(
      since
    )}&per_page=${perPage}&page=${page}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "commit-dashboard",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${text}`);
    }

    const batch = (await res.json()) as GitHubCommit[];
    all.push(...batch);

    if (batch.length < perPage) break;
    page += 1;

    // Safety cap to avoid infinite loops on weird APIs
    if (page > 20) break;
  }

  return all;
}
