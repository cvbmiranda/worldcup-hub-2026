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
    <div className="w-full flex flex-col bg-slate-950/60 p-1 rounded mb-1 shadow-sm hover:bg-slate-900 hover:shadow-md transition-all duration-300 group">
      
      {matchInfo && (
        <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest text-center mb-2 pb-2 border-b border-slate-800/50 truncate">
          {matchInfo}
        </div>
      )}

      {isKnockout ? (
        <div className="w-full flex flex-col relative z-10">
          {/* Linha Time 1 */}
          <div className="flex justify-between items-center w-full py-1 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              {match.team1 && (
                <img
                  src={match.team1.flag_url}
                  alt={match.team1.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              )}
              <span className="text-xs font-bold text-slate-300 truncate w-12 leading-tight">
                {match.team1 ? match.team1.name : "Vencedor"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {showPenalties && (
                <input
                  type="number"
                  min="0"
                  className="w-4 text-center text-[10px] font-bold text-yellow-400 bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
                  value={match.penalties_score1 ?? ''}
                  onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null, true)}
                  placeholder="-"
                />
              )}
              <input
                type="number"
                min="0"
                className="w-6 h-6 text-center text-xs font-bold text-white bg-slate-800 rounded focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all placeholder-slate-700"
                value={match.score1 ?? ''}
                onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="-"
                disabled={!match.team1 || !match.team2}
              />
            </div>
          </div>

          {/* Linha Time 2 */}
          <div className="flex justify-between items-center w-full py-1 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              {match.team2 && (
                <img
                  src={match.team2.flag_url}
                  alt={match.team2.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              )}
              <span className="text-xs font-bold text-slate-300 truncate w-12 leading-tight">
                {match.team2 ? match.team2.name : "Vencedor"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {showPenalties && (
                <input
                  type="number"
                  min="0"
                  className="w-4 text-center text-[10px] font-bold text-yellow-400 bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
                  value={match.penalties_score2 ?? ''}
                  onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null, true)}
                  placeholder="-"
                />
              )}
              <input
                type="number"
                min="0"
                className="w-6 h-6 text-center text-xs font-bold text-white bg-slate-800 rounded focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all placeholder-slate-700"
                value={match.score2 ?? ''}
                onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="-"
                disabled={!match.team1 || !match.team2}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-between items-center relative z-10">
          {/* Time 1 (Mandante) */}
          <div className="w-1/3 flex justify-end items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-300 truncate text-right group-hover:text-white transition-colors leading-tight">
              {match.team1 ? match.team1.name : "Vencedor"}
            </span>
            {match.team1 && (
              <img
                src={match.team1.flag_url}
                alt={match.team1.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            )}
          </div>

          {/* Placar Central (Gols e Pênaltis Empilhados) */}
          <div className="w-1/3 flex flex-col justify-center items-center">
            {/* Linha 1: Tempo Normal */}
            <div className="flex items-center justify-center gap-1">
              <input
                type="number"
                min="0"
                className="w-6 h-6 text-center text-xs font-bold text-white bg-slate-900/50 rounded focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all placeholder-slate-700"
                value={match.score1 ?? ''}
                onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="-"
                disabled={!match.team1 || !match.team2}
              />
              <span className="text-slate-600 font-bold text-[9px]">X</span>
              <input
                type="number"
                min="0"
                className="w-6 h-6 text-center text-xs font-bold text-white bg-slate-900/50 rounded focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all placeholder-slate-700"
                value={match.score2 ?? ''}
                onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="-"
                disabled={!match.team1 || !match.team2}
              />
            </div>

            {/* Linha 2: Pênaltis (Renderização Condicional) */}
            {showPenalties && (
              <div className="flex items-center justify-center gap-0.5 mt-0.5 animate-in zoom-in duration-300">
                <span className="text-slate-500 font-bold text-[9px]">(</span>
                <input
                  type="number"
                  min="0"
                  className="w-4 h-4 text-center text-[10px] font-bold text-yellow-400 bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
                  value={match.penalties_score1 ?? ''}
                  onChange={(e) => onScoreChange(match.id, 'team1', e.target.value ? parseInt(e.target.value) : null, true)}
                  placeholder="-"
                />
                <span className="text-yellow-500/70 font-black text-[8px]">PEN</span>
                <input
                  type="number"
                  min="0"
                  className="w-4 h-4 text-center text-[10px] font-bold text-yellow-400 bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
                  value={match.penalties_score2 ?? ''}
                  onChange={(e) => onScoreChange(match.id, 'team2', e.target.value ? parseInt(e.target.value) : null, true)}
                  placeholder="-"
                />
                <span className="text-slate-500 font-bold text-[9px]">)</span>
              </div>
            )}
          </div>

          {/* Time 2 (Visitante) */}
          <div className="w-1/3 flex justify-start items-center gap-2 min-w-0">
            {match.team2 && (
              <img
                src={match.team2.flag_url}
                alt={match.team2.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            )}
            <span className="text-xs font-bold text-slate-300 truncate text-left group-hover:text-white transition-colors leading-tight">
              {match.team2 ? match.team2.name : "Vencedor"}
            </span>
          </div>
        </div>
      )}



    </div>
  );
}