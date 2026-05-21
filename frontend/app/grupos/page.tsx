"use client";

import { useEffect, useState, useRef } from "react";
import { api, updateMatchResult } from "../../services/api";
import MatchCard, { Match } from "../../components/MatchCard";
import KnockoutTree from "../../components/KnockoutTree";

interface Team {
  id: number;
  name: string;
  strength: number;
  flag_url: string;
}

interface Group {
  id: number;
  name: string;
  teams: Team[];
}

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRounds, setActiveRounds] = useState<{ [key: number]: number }>({});
  
  const saveTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    Promise.all([api.get("groups/"), api.get("matches/")])
      .then(([groupsResponse, matchesResponse]) => {
        setGroups(groupsResponse.data);
        setMatches(matchesResponse.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro na API:", error);
        setLoading(false);
      });
  }, []);

  const handleScoreChange = (matchId: number, team: 'team1' | 'team2', score: number | null) => {
    setMatches(prevMatches => {
      const updatedMatches = prevMatches.map(m =>
        m.id === matchId ? { ...m, [team === 'team1' ? 'score1' : 'score2']: score } : m
      );
      
      const updatedMatch = updatedMatches.find(m => m.id === matchId);
      
      if (updatedMatch) {
        if (saveTimeouts.current[matchId]) {
          clearTimeout(saveTimeouts.current[matchId]);
        }
        saveTimeouts.current[matchId] = setTimeout(() => {
          updateMatchResult(matchId, updatedMatch.score1, updatedMatch.score2)
            .catch(err => console.error(`Erro ao salvar partida ${matchId}:`, err));
        }, 800);
      }
      
      return updatedMatches;
    });
  };

  const calculateTable = (groupTeams: Team[], groupMatches: Match[]) => {
    let table = groupTeams.map(team => ({
      ...team,
      pts: 0, p: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, perc: "0.0"
    }));

    groupMatches.forEach(match => {
      if (match.score1 !== null && match.score2 !== null) {
        const t1 = table.find(t => t.id === match.team1?.id);
        const t2 = table.find(t => t.id === match.team2?.id);

        if (t1 && t2) {
          t1.p += 1; t2.p += 1;
          t1.gp += match.score1; t1.gc += match.score2;
          t2.gp += match.score2; t2.gc += match.score1;

          if (match.score1 > match.score2) {
            t1.pts += 3; t1.v += 1; t2.d += 1;
          } else if (match.score1 < match.score2) {
            t2.pts += 3; t2.v += 1; t1.d += 1;
          } else {
            t1.pts += 1; t2.pts += 1; t1.e += 1; t2.e += 1;
          }
          t1.sg = t1.gp - t1.gc;
          t2.sg = t2.gp - t2.gc;
        }
      }
    });

    return table.map(team => {
      const perc = team.p > 0 ? ((team.pts / (team.p * 3)) * 100).toFixed(1) : "0.0";
      return { ...team, perc };
    }).sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
  };

  const handleRandomFill = () => {
    const updatedMatches = matches.map(m => {
      if (m.stage === 'GROUP' && m.team1 && m.team2) {
        const t1 = m.team1 as any;
        const t2 = m.team2 as any;
        const diff = (t1.strength - t2.strength) / 20; 
        const s1 = Math.max(0, Math.round(1.5 + diff + (Math.random() * 2 - 1)));
        const s2 = Math.max(0, Math.round(1.5 - diff + (Math.random() * 2 - 1)));
        return { ...m, score1: s1, score2: s2 };
      }
      return m;
    });
    setMatches(updatedMatches);
    updatedMatches.forEach(m => {
      if (m.stage === 'GROUP') {
        updateMatchResult(m.id, m.score1, m.score2).catch(console.error);
      }
    });
  };

  const handleClearAll = () => {
    const updatedMatches = matches.map(m => {
      if (m.stage === 'GROUP') {
        return { ...m, score1: null, score2: null };
      }
      return m;
    });
    setMatches(updatedMatches);
    updatedMatches.forEach(m => {
      if (m.stage === 'GROUP') {
        updateMatchResult(m.id, null, null).catch(console.error);
      }
    });
  };

  const changeRound = (groupId: number, dir: number) => {
    setActiveRounds(prev => {
      const current = prev[groupId] || 1;
      const next = Math.max(1, Math.min(3, current + dir));
      return { ...prev, [groupId]: next };
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-fifa-green"></div>
    </div>
  );

  return (
    <div className="pb-10">
      <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-green via-fifa-blue to-fifa-purple mb-6 text-center uppercase tracking-widest drop-shadow-sm">
        Fase de Grupos
      </h1>

      <div className="flex justify-center gap-4 mb-10">
        <button onClick={handleRandomFill} className="px-6 py-2 bg-slate-900/80 border border-fifa-blue/50 text-fifa-blue font-bold rounded-lg hover:bg-fifa-blue hover:text-slate-900 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          🎲 Preencher Aleatoriamente
        </button>
        <button onClick={handleClearAll} className="px-6 py-2 bg-slate-900/80 border border-fifa-red/50 text-fifa-red font-bold rounded-lg hover:bg-fifa-red hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,77,0.2)]">
          🗑️ Limpar Tudo
        </button>
      </div>

      <div className="flex flex-col gap-12 items-center mb-16">
        {groups.map((group) => {
          const groupMatches = matches.filter(m => m.group === group.id).sort((a,b) => a.id - b.id);
          const standings = calculateTable(group.teams, groupMatches);
          
          const currentRound = activeRounds[group.id] || 1;
          const roundMatches = groupMatches.filter(m => (m.round_number || 1) === currentRound);

          return (
            <div key={group.id} className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700/50 flex flex-col lg:flex-row hover:border-fifa-purple/50 hover:shadow-[0_0_20px_rgba(122,0,255,0.15)] transition-all duration-300">

              {/* Tabela de Classificação Atualizada */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700/50 flex flex-col">
                <div className="bg-slate-950/80 text-transparent bg-clip-text bg-gradient-to-r from-fifa-green to-fifa-blue text-center py-4 font-black text-2xl tracking-widest border-b border-slate-700/50 uppercase">
                  GRUPO {group.name}
                </div>
                <div className="p-3 flex-1 bg-slate-950/30 w-full overflow-x-auto">
                  <div className="w-full min-w-max">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700/50 text-xs md:text-sm">
                          <th className="px-3 py-3 font-bold uppercase tracking-wider">Seleção</th>
                          <th className="px-2 py-3 text-center font-bold text-fifa-green w-8" title="Pontos">P</th>
                          <th className="px-2 py-3 text-center font-bold w-8" title="Jogos">J</th>
                          <th className="px-2 py-3 text-center font-bold w-8" title="Vitórias">V</th>
                          <th className="px-2 py-3 text-center font-bold w-8" title="Empates">E</th>
                          <th className="px-2 py-3 text-center font-bold w-8" title="Derrotas">D</th>
                          <th className="px-2 py-3 text-center font-bold w-8" title="Saldo de Gols">SG</th>
                          <th className="px-2 py-3 text-center font-bold text-cyan-400 w-12" title="Aproveitamento">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr key={team.id} className={`border-b border-slate-700/30 last:border-0 hover:bg-slate-800/50 transition-colors ${index < 2 ? 'bg-fifa-green/5' : ''}`}>
                            <td className="px-3 py-3 flex items-center gap-3 font-bold text-slate-200">
                              <span className={`w-4 text-center text-xs md:text-sm font-black ${index < 2 ? 'text-fifa-green' : 'text-slate-600'}`}>{index + 1}</span>
                              <img src={team.flag_url} alt={team.name} className="min-w-[28px] max-w-[28px] h-7 rounded-full object-cover object-center overflow-hidden shrink-0 border-2 border-slate-800 shadow-sm" />
                              <span className="truncate whitespace-nowrap text-sm md:text-base">{team.name}</span>
                            </td>
                            <td className="px-2 py-3 text-center font-black text-white">{team.pts}</td>
                            <td className="px-2 py-3 text-center font-medium text-slate-400">{team.p}</td>
                            <td className="px-2 py-3 text-center font-medium text-slate-400">{team.v}</td>
                            <td className="px-2 py-3 text-center font-medium text-slate-400">{team.e}</td>
                            <td className="px-2 py-3 text-center font-medium text-slate-400">{team.d}</td>
                            <td className="px-2 py-3 text-center font-medium text-slate-400">{team.sg}</td>
                            <td className="px-2 py-3 text-center font-medium text-cyan-400">{team.perc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lista de Jogos por Rodada com Paginador GE */}
              <div className="w-full flex-1 bg-slate-950/50 p-4 flex flex-col">
                <div className="flex items-center justify-between bg-slate-900/80 rounded-full px-4 py-2 mb-6 border border-slate-700/50 shrink-0">
                  <button 
                    onClick={() => changeRound(group.id, -1)}
                    disabled={currentRound === 1}
                    className="text-fifa-blue hover:text-white disabled:opacity-30 disabled:hover:text-fifa-blue transition-colors p-2"
                  >
                    &#10094;
                  </button>
                  <span className="text-fifa-blue font-black text-sm uppercase tracking-widest">
                    {currentRound}ª Rodada
                  </span>
                  <button 
                    onClick={() => changeRound(group.id, 1)}
                    disabled={currentRound === 3}
                    className="text-fifa-blue hover:text-white disabled:opacity-30 disabled:hover:text-fifa-blue transition-colors p-2"
                  >
                    &#10095;
                  </button>
                </div>

                <div className="flex flex-col gap-6 w-full flex-1 justify-center">
                  {roundMatches.map(match => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      onScoreChange={handleScoreChange} 
                    />
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
