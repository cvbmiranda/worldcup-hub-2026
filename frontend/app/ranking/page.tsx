"use client";

import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface Team {
  id: number;
  name: string;
  flag_url: string;
}

interface Match {
  id: number;
  stage: string;
  score1: number | null;
  score2: number | null;
  penalties_score1?: number | null;
  penalties_score2?: number | null;
  team1: Team | null;
  team2: Team | null;
  played: boolean;
}

interface GlobalTeamStats extends Team {
  p: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  pts: number;
  stageLevel: number;
  stageName: string;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<GlobalTeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("teams/"), api.get("matches/")])
      .then(([teamsRes, matchesRes]) => {
        const teams: Team[] = teamsRes.data;
        const matches: Match[] = matchesRes.data;

        const statsMap: Record<number, GlobalTeamStats> = {};
        teams.forEach(t => {
          statsMap[t.id] = { ...t, p: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0, stageLevel: 1, stageName: 'Fase de Grupos' };
        });

        matches.forEach(m => {
          if (!m.played || m.score1 === null || m.score2 === null || !m.team1 || !m.team2) return;
          
          const t1 = statsMap[m.team1.id];
          const t2 = statsMap[m.team2.id];
          if (!t1 || !t2) return;

          let winnerId = 0;
          if (m.score1 > m.score2) winnerId = t1.id;
          else if (m.score2 > m.score1) winnerId = t2.id;
          else if (m.penalties_score1 != null && m.penalties_score2 != null) {
            if (m.penalties_score1 > m.penalties_score2) winnerId = t1.id;
            else if (m.penalties_score2 > m.penalties_score1) winnerId = t2.id;
          }

          // Vitórias nos pênaltis contam estatisticamente como Empate para pts, mas para avanço contam como vitória.
          // Seguindo lógica oficial: Empate no tempo normal = 1 ponto pra cada.
          const isDraw = m.score1 === m.score2;

          const updateStats = (team: GlobalTeamStats, gf: number, ga: number, isMatchWinner: boolean) => {
            team.p += 1;
            team.gp += gf;
            team.gc += ga;
            team.sg = team.gp - team.gc;
            
            if (isDraw) {
              team.e += 1;
              team.pts += 1;
            } else if (isMatchWinner) {
              team.v += 1;
              team.pts += 3;
            } else {
              team.d += 1;
            }
          };

          updateStats(t1, m.score1, m.score2, winnerId === t1.id);
          updateStats(t2, m.score2, m.score1, winnerId === t2.id);

          const stageVal = (stageStr: string, isMatchWinner: boolean) => {
            switch (stageStr) {
              case 'FINAL': return isMatchWinner ? 7 : 6;
              case 'SEMI': return 5;
              case 'QUARTER': return 4;
              case 'ROUND_16': return 3;
              case 'ROUND_32': return 2;
              default: return 1;
            }
          };
          
          t1.stageLevel = Math.max(t1.stageLevel, stageVal(m.stage, winnerId === t1.id));
          t2.stageLevel = Math.max(t2.stageLevel, stageVal(m.stage, winnerId === t2.id));
        });

        const getStageName = (lvl: number) => {
          switch (lvl) {
            case 7: return 'Campeão';
            case 6: return 'Vice-Campeão';
            case 5: return 'Semifinal';
            case 4: return 'Quartas de Final';
            case 3: return 'Oitavas de Final';
            case 2: return '16-avos de Final';
            default: return 'Fase de Grupos';
          }
        };

        const results = Object.values(statsMap).map(t => ({
          ...t,
          stageName: getStageName(t.stageLevel)
        }));

        results.sort((a, b) => {
          if (b.stageLevel !== a.stageLevel) return b.stageLevel - a.stageLevel;
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.sg !== a.sg) return b.sg - a.sg;
          return b.gp - a.gp;
        });

        setRanking(results);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-fifa-green"></div>
    </div>
  );

  return (
    <div className="pb-10 pt-10 px-4 md:px-0">
      <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-green via-fifa-blue to-fifa-purple mb-8 text-center uppercase tracking-widest drop-shadow-md">
        Ranking Global
      </h1>

      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700/50 max-w-6xl mx-auto">
        <div className="overflow-x-auto w-full p-2">
          <table className="w-full min-w-max text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-700/50 text-xs">
                <th className="px-4 py-4 font-black uppercase tracking-wider text-center w-16">Pos</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider">Seleção</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Fase Alcançada</th>
                <th className="px-4 py-4 text-center font-black text-fifa-green" title="Pontos">Pts</th>
                <th className="px-4 py-4 text-center font-black" title="Jogos">J</th>
                <th className="px-4 py-4 text-center font-black" title="Vitórias">V</th>
                <th className="px-4 py-4 text-center font-black" title="Empates">E</th>
                <th className="px-4 py-4 text-center font-black" title="Derrotas">D</th>
                <th className="px-4 py-4 text-center font-black" title="Gols Pró">GP</th>
                <th className="px-4 py-4 text-center font-black" title="Gols Contra">GC</th>
                <th className="px-4 py-4 text-center font-black" title="Saldo de Gols">SG</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((team, index) => {
                const isChampion = index === 0 && team.stageLevel === 7;
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
                const posClass = index < 3 ? "text-lg drop-shadow-lg" : "text-slate-500 font-bold";
                
                return (
                  <tr key={team.id} className={`border-b border-slate-700/30 last:border-0 hover:bg-slate-800/80 transition-colors ${isChampion ? 'bg-gradient-to-r from-fifa-green/10 to-transparent border-fifa-green/30' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <span className={posClass}>
                        {medal || `${index + 1}º`}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3 font-bold text-slate-200">
                      <img src={team.flag_url} alt={team.name} className="w-8 h-8 rounded-full object-cover object-center border-2 border-slate-800 shadow-md" />
                      <span className={`text-base truncate ${isChampion ? 'text-fifa-green font-black' : ''}`}>{team.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${team.stageLevel === 7 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : team.stageLevel >= 2 ? 'bg-fifa-blue/10 text-fifa-blue border border-fifa-blue/30' : 'bg-slate-800 text-slate-400'}`}>
                        {team.stageName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-white text-base">{team.pts}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.p}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.v}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.e}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.d}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.gp}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{team.gc}</td>
                    <td className={`px-4 py-3 text-center font-black ${team.sg > 0 ? 'text-fifa-green' : team.sg < 0 ? 'text-fifa-red' : 'text-slate-400'}`}>{team.sg > 0 ? `+${team.sg}` : team.sg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
