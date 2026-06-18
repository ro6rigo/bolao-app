type TeamBadgeProps = {
  name: string;
  crest?: string | null;
  tla?: string | null;
};

function TeamBadge({ name, crest, tla }: TeamBadgeProps) {
  const initials = (tla ?? name.slice(0, 3)).toUpperCase();

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-md ring-2 ring-amber-400/80 sm:h-20 sm:w-20">
        {crest ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={crest}
            alt=""
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
        ) : (
          <span className="text-lg font-bold text-zinc-400">{initials}</span>
        )}
      </div>
      <p className="max-w-[7rem] truncate text-center text-sm font-semibold text-white sm:max-w-[9rem] sm:text-base">
        {name}
      </p>
    </div>
  );
}

type MatchScoreboardProps = {
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest?: string | null;
  awayTeamCrest?: string | null;
  competition?: string | null;
  matchDate: string;
  homeScore?: number | null;
  awayScore?: number | null;
  scoreInputs?: React.ReactNode;
};

export function MatchScoreboard({
  homeTeam,
  awayTeam,
  homeTeamCrest,
  awayTeamCrest,
  competition,
  matchDate,
  homeScore,
  awayScore,
  scoreInputs,
}: MatchScoreboardProps) {
  const formattedDate = new Date(matchDate).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800 shadow-lg ring-1 ring-zinc-700/50">
      <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 px-4 py-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          {competition ?? "Palpite"}
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <TeamBadge name={homeTeam} crest={homeTeamCrest} />
          <div className="flex shrink-0 flex-col items-center gap-1">
            {scoreInputs ??
              (homeScore != null && awayScore != null ? (
                <p className="flex items-center gap-2 text-3xl font-bold tabular-nums sm:text-4xl">
                  <span className="text-red-500">{homeScore}</span>
                  <span className="font-light text-white/50">-</span>
                  <span className="text-red-500">{awayScore}</span>
                </p>
              ) : (
                <p className="text-3xl font-bold tabular-nums text-white sm:text-4xl">VS</p>
              ))}
          </div>
          <TeamBadge name={awayTeam} crest={awayTeamCrest} />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-400">{formattedDate}</p>
      </div>
    </div>
  );
}
