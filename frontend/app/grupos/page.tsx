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

  const deriveKnockoutMatches = (): Match[] => {
    if (groups.length === 0) return [];

    let winners: any[] = [];
    let runnersUp: any[] = [];
    let thirds: any[] = [];

    groups.forEach(group => {
      const groupMatches = matches.filter(m => m.group === group.id);
      const standings = calculateTable(group.teams, groupMatches);
      
      if (standings.length >= 1) winners.push({ ...standings[0], group: group.name });
      if (standings.length >= 2) runnersUp.push({ ...standings[1], group: group.name });
      if (standings.length >= 3) thirds.push({ ...standings[2], group: group.name });
    });

    winners.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    runnersUp.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    thirds.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    
    const top8Thirds = thirds.slice(0, 8);
    const r32: Match[] = [];
    let matchIdMock = 1000;

    const createMockMatch = (t1: any, t2: any): Match => ({
      id: matchIdMock++,
      team1: { id: t1.id, name: t1.name, flag_url: t1.flag_url, strength: t1.strength },
      team2: { id: t2.id, name: t2.name, flag_url: t2.flag_url, strength: t2.strength },
      score1: null,
      score2: null,
      group: 0,
      stage: 'ROUND_32'
    });

    if (winners.length === 12 && runnersUp.length === 12 && top8Thirds.length === 8) {
      for (let i = 0; i < 8; i++) {
        r32.push(createMockMatch(winners[i], top8Thirds[7 - i]));
      }
      for (let i = 0; i < 4; i++) {
        r32.push(createMockMatch(winners[8 + i], runnersUp[11 - i]));
      }
      for (let i = 0; i < 4; i++) {
        r32.push(createMockMatch(runnersUp[i], runnersUp[7 - i]));
      }
    }
    return r32;
  };

  const handleRandomFill = () => {
    const updatedMatches = matches.map(m => {
      if (m.stage === 'GROUP' && m.team1 && m.team2) {
        const diff = (m.team1.strength - m.team2.strength) / 20; 
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

  const liveKnockoutMatches = deriveKnockoutMatches();

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
        {groups.map((group) => {
          const groupMatches = matches.filter(m => m.group === group.id).sort((a,b) => a.id - b.id);
          const standings = calculateTable(group.teams, groupMatches);
          
          const currentRound = activeRounds[group.id] || 1;
          const roundMatches = groupMatches.filter(m => (m.round_number || 1) === currentRound);

          return (
            <div key={group.id} className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700/50 flex flex-col lg:flex-row hover:border-fifa-purple/50 hover:shadow-[0_0_20px_rgba(122,0,255,0.15)] transition-all duration-300">

              {/* Tabela de Classificação Atualizada */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700/50 flex flex-col">
                <div className="bg-slate-950/80 text-transparent bg-clip-text bg-gradient-to-r from-fifa-green to-fifa-blue text-center py-4 font-black text-2xl tracking-widest border-b border-slate-700/50 uppercase">
                  GRUPO {group.name}
                </div>
                <div className="p-3 overflow-x-auto flex-1 bg-slate-950/30">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700/50 text-xs">
                        <th className="pb-2 font-bold uppercase tracking-wider">Seleção</th>
                        <th className="pb-2 text-center font-bold text-fifa-green" title="Pontos">P</th>
                        <th className="pb-2 text-center font-bold" title="Jogos">J</th>
                        <th className="pb-2 text-center font-bold" title="Vitórias">V</th>
                        <th className="pb-2 text-center font-bold" title="Empates">E</th>
                        <th className="pb-2 text-center font-bold" title="Derrotas">D</th>
                        <th className="pb-2 text-center font-bold" title="Saldo de Gols">SG</th>
                        <th className="pb-2 text-center font-bold" title="Aproveitamento">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, index) => (
                        <tr key={team.id} className={`border-b border-slate-700/30 last:border-0 hover:bg-slate-800/50 transition-colors ${index < 2 ? 'bg-fifa-green/5' : ''}`}>
                          <td className="py-2.5 flex items-center gap-3 font-bold text-slate-200">
                            <span className={`w-4 text-center text-xs font-black ${index < 2 ? 'text-fifa-green' : 'text-slate-600'}`}>{index + 1}</span>
                            <img src={team.flag_url} alt={team.name} className="min-w-[28px] max-w-[28px] h-7 rounded-full object-cover object-center overflow-hidden shrink-0 border-2 border-slate-800 shadow-sm" />
                            <span className="truncate">{team.name}</span>
                          </td>
                          <td className="py-2.5 text-center font-black text-white">{team.pts}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.p}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.v}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.e}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.d}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.sg}</td>
                          <td className="py-2.5 text-center font-medium text-slate-400">{team.perc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lista de Jogos por Rodada com Paginador GE */}
              <div className="w-full lg:w-1/2 bg-slate-950/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between bg-slate-900/80 rounded-full px-4 py-2 mb-4 border border-slate-700/50">
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

                  <div className="flex flex-col gap-4">
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

            </div>
          );
        })}
      </div>

      {/* Árvore de Mata-Mata ao Vivo */}
      {liveKnockoutMatches.length > 0 && (
        <div className="mt-12 border-t border-slate-700/50 pt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-blue to-fifa-purple uppercase tracking-widest drop-shadow-md">
              Mata-Mata em Tempo Real
            </h2>
            <p className="text-slate-400 mt-2">
              Projeção dos 16-avos de final baseada nos placares atuais dos grupos.
            </p>
          </div>
          <KnockoutTree matches={liveKnockoutMatches} onScoreChange={() => {}} />
        </div>
      )}
    </div>
  );
}