"use client";

import { useEffect, useState, useRef } from "react";
import { api, generateKnockout, updateMatchResult } from "../../services/api";
import KnockoutTree from "../../components/KnockoutTree";
import { Match } from "../../components/MatchCard";

export default function SimuladorPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const saveTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const loadMatches = () => {
    setLoading(true);
    api.get("matches/")
      .then((res) => {
        setMatches(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar partidas:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateKnockout();
      // Recarrega as partidas para exibir a chave atualizada
      loadMatches();
    } catch (error) {
      alert("Erro ao gerar o chaveamento. Verifique se os dados estão completos.");
    } finally {
      setGenerating(false);
    }
  };

  const handleScoreChange = (matchId: number, team: 'team1' | 'team2', score: number | null, isPenalty?: boolean) => {
    setMatches(prevMatches => {
      const updatedMatches = prevMatches.map(m => {
        if (m.id === matchId) {
          if (isPenalty) {
            return { ...m, [team === 'team1' ? 'penalties_score1' : 'penalties_score2']: score };
          }
          return { ...m, [team === 'team1' ? 'score1' : 'score2']: score };
        }
        return m;
      });
      
      const updatedMatch = updatedMatches.find(m => m.id === matchId);
      
      if (updatedMatch) {
        if (saveTimeouts.current[matchId]) {
          clearTimeout(saveTimeouts.current[matchId]);
        }
        saveTimeouts.current[matchId] = setTimeout(() => {
          updateMatchResult(
            matchId, 
            updatedMatch.score1, 
            updatedMatch.score2,
            updatedMatch.penalties_score1,
            updatedMatch.penalties_score2
          ).then(() => {
            // Se foi uma alteração no mata-mata, recarregar a árvore para ver quem avançou
            if (updatedMatch.stage !== 'GROUP' && updatedMatch.score1 !== null && updatedMatch.score2 !== null) {
              loadMatches();
            }
          }).catch(err => console.error(`Erro ao salvar partida ${matchId}:`, err));
        }, 800);
      }
      
      return updatedMatches;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-fifa-green"></div>
      </div>
    );
  }

  const groupMatches = matches.filter(m => m.stage === 'GROUP');
  const knockoutMatches = matches.filter(m => m.stage !== 'GROUP');
  
  // Condição: todos os 72 jogos do grupo estão jogados?
  const allGroupsFinished = groupMatches.length > 0 && groupMatches.every(m => m.played);

  return (
    <div className="pb-10 pt-10">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700/50 p-6 md:p-10 min-h-[50vh] flex flex-col items-center">
        
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-green via-fifa-blue to-fifa-purple mb-8 text-center uppercase tracking-widest drop-shadow-md">
          Simulador Mata-Mata
        </h1>

        {knockoutMatches.length > 0 ? (
          <div className="w-full">
            <div className="text-center mb-8">
              <span className="bg-fifa-purple/10 text-fifa-blue px-5 py-2 rounded-full text-sm font-black border border-fifa-purple/30 tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                CHAVEAMENTO OFICIAL 2026
              </span>
            </div>
            <KnockoutTree matches={knockoutMatches} onScoreChange={handleScoreChange} />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center mt-10">
            {!allGroupsFinished ? (
              <div className="bg-slate-950/80 p-10 rounded-2xl border border-fifa-red/30 max-w-lg shadow-[0_0_20px_rgba(255,0,77,0.1)]">
                <span className="text-5xl mb-4 block drop-shadow-[0_0_10px_rgba(255,0,77,0.5)]">⚠️</span>
                <h3 className="text-2xl font-black text-fifa-red mb-3 uppercase tracking-wider">Fase Incompleta</h3>
                <p className="text-slate-400 font-medium">
                  Você precisa preencher os resultados de todas as partidas da Fase de Grupos para gerar o cruzamento do Mata-Mata.
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/80 p-10 rounded-2xl border border-fifa-green/30 max-w-lg flex flex-col items-center shadow-[0_0_20px_rgba(207,249,0,0.1)]">
                <span className="text-5xl mb-4 block drop-shadow-[0_0_15px_rgba(207,249,0,0.5)]">🏆</span>
                <h3 className="text-2xl font-black text-fifa-green mb-3 uppercase tracking-wider">Tudo Pronto!</h3>
                <p className="text-slate-400 mb-8 font-medium">
                  A fase de grupos foi concluída. Clique no botão abaixo para o supercomputador calcular os classificados e gerar a árvore oficial das eliminatórias.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-10 py-5 bg-gradient-to-r from-fifa-purple to-fifa-red hover:from-fifa-blue hover:to-fifa-purple text-white font-black rounded-full text-lg tracking-widest shadow-[0_0_25px_rgba(122,0,255,0.4)] transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 uppercase"
                >
                  {generating ? "Calculando..." : "GERAR CHAVEAMENTO OFICIAL"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
