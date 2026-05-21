interface Team {
  id: number;
  name: string;
  flag_url: string;
}

export interface Match {
  id: number;
  official_id?: number | null;
  round_number?: number | null;
  team1: Team;
  team2: Team;
  score1: number | null;
  score2: number | null;
  penalties_score1?: number | null;
  penalties_score2?: number | null;
  group: number;
  stage?: string;
  match_date_utc?: string;
  stadium_name?: string;
  played?: boolean;
}

interface MatchCardProps {
  match: Match;
  onScoreChange: (matchId: number, team: 'team1' | 'team2', score: number | null, isPenalty?: boolean) => void;
}

export default function MatchCard({ match, onScoreChange }: MatchCardProps) {
  const isKnockout = match.stage && match.stage !== 'GROUP';
  const isTied = match.score1 !== null && match.score2 !== null && match.score1 === match.score2;
  const showPenalties = isKnockout && isTied;

  let matchInfo = '';
  if (match.official_id || match.match_date_utc || match.stadium_name) {
    const parts = [];
    if (match.official_id) parts.push(`Partida nº ${match.official_id}`);
    if (match.match_date_utc) {
      const d = new Date(match.match_date_utc);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      parts.push(`${day}/${month} às ${hours}:${minutes}`);
    }
    if (match.stadium_name) parts.push(match.stadium_name);
    matchInfo = parts.join(' | ');
  }

  return (
    <div className="flex flex-col bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/50 mb-2 shadow-lg hover:bg-slate-900 hover:border-fifa-purple/50 hover:shadow-[0_0_15px_rgba(122,0,255,0.2)] hover:-translate-y-0.5 transition-all duration-300 group">
      
      {matchInfo && (
        <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest text-center mb-2 pb-2 border-b border-slate-800/50 truncate">
          {matchInfo}
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        {/* Time 1 (Mandante) */}
        <div className="flex flex-1 items-center gap-2 justify-end min-w-0">
          <span className="text-sm sm:text-base font-bold text-slate-200 truncate text-right group-hover:text-fifa-green transition-colors">
            {match.team1 ? match.team1.name : "Vencedor"}
          </span>
          {match.team1 && (
            <img
              src={match.team1.flag_url}
              alt={match.team1.name}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover object-center shrink-0 border-2 border-slate-800 shadow-md"
            />
          )}
        </div>

        {/* Placar (Inputs para digitar os golos) */}
        <div className="flex items-center justify-center gap-2 shrink-0 px-2 sm:px-4">
          <input
            type="number"
            min="0"
            className="w-8 h-8 sm:w-11 sm:h-11 text-center font-black text-fifa-green bg-slate-950 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-fifa-green focus:border-transparent focus:outline-none transition-all shadow-inner placeholder-slate-700"
            value={match.score1 ?? ''}
            onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="-"
            disabled={!match.team1 || !match.team2}
          />
          <span className="text-slate-600 font-black text-xs sm:text-sm">X</span>
          <input
            type="number"
            min="0"
            className="w-8 h-8 sm:w-11 sm:h-11 text-center font-black text-fifa-blue bg-slate-950 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-fifa-blue focus:border-transparent focus:outline-none transition-all shadow-inner placeholder-slate-700"
            value={match.score2 ?? ''}
            onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="-"
            disabled={!match.team1 || !match.team2}
          />
        </div>

        {/* Time 2 (Visitante) */}
        <div className="flex flex-1 items-center gap-2 justify-start min-w-0">
          {match.team2 && (
            <img
              src={match.team2.flag_url}
              alt={match.team2.name}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover object-center shrink-0 border-2 border-slate-800 shadow-md"
            />
          )}
          <span className="text-sm sm:text-base font-bold text-slate-200 truncate text-left group-hover:text-fifa-blue transition-colors">
            {match.team2 ? match.team2.name : "Vencedor"}
          </span>
        </div>
      </div>

      {/* Pênaltis (Aparece apenas se for mata-mata e estiver empatado) */}
      {showPenalties && (
        <div className="flex justify-center mt-3 pt-3 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-full border border-fifa-orange/30 shadow-[0_0_10px_rgba(255,94,0,0.1)]">
            <span className="text-[10px] font-black text-fifa-orange uppercase tracking-widest">Pênaltis</span>
            <input
              type="number"
              min="0"
              className="w-7 h-7 text-center text-sm font-black text-fifa-green bg-slate-900 border border-slate-700 rounded-md focus:ring-1 focus:ring-fifa-green focus:outline-none"
              value={match.penalties_score1 ?? ''}
              onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null, true)}
            />
            <span className="text-slate-600 font-black text-xs">-</span>
            <input
              type="number"
              min="0"
              className="w-7 h-7 text-center text-sm font-black text-fifa-blue bg-slate-900 border border-slate-700 rounded-md focus:ring-1 focus:ring-fifa-blue focus:outline-none"
              value={match.penalties_score2 ?? ''}
              onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null, true)}
            />
          </div>
        </div>
      )}

    </div>
  );
}