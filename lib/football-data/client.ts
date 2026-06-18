const BASE_URL = "https://api.football-data.org/v4";

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  competition?: { id: number; name: string; code?: string };
};

type FootballDataListResponse = {
  matches: FootballDataMatch[];
  resultSet?: { count: number };
  message?: string;
};

function getApiToken() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_TOKEN não configurado");
  }
  return token;
}

function getBrazilTeamId() {
  return Number(process.env.FOOTBALL_DATA_BRAZIL_TEAM_ID ?? "764");
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "X-Auth-Token": getApiToken(),
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(`football-data.org erro ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

export function getTeamCrests(match: FootballDataMatch) {
  return {
    homeTeamCrest: match.homeTeam.crest ?? null,
    awayTeamCrest: match.awayTeam.crest ?? null,
    competition: match.competition?.name ?? null,
  };
}

export function normalizeMatch(match: FootballDataMatch) {
  return {
    matchId: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    date: match.utcDate,
    status: match.status,
    competition: match.competition?.name ?? null,
  };
}

export async function fetchBrazilMatches(season?: number) {
  const year = season ?? new Date().getFullYear();
  const teamId = getBrazilTeamId();
  const data = await apiFetch<FootballDataListResponse>(
    `/teams/${teamId}/matches?season=${year}&limit=100`,
  );

  return (data.matches ?? []).sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
  );
}

export async function fetchMatchById(matchId: number) {
  return apiFetch<FootballDataMatch>(`/matches/${matchId}`);
}

export function isMatchFinished(status: string) {
  return status === "FINISHED";
}

export function getFullTimeScore(match: FootballDataMatch) {
  return {
    home: match.score.fullTime.home ?? 0,
    away: match.score.fullTime.away ?? 0,
  };
}
