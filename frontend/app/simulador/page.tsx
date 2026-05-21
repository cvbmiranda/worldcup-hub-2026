"use client";

import { useEffect, useState, useRef } from "react";
import { api, generateKnockout, updateMatchResult, simulateKnockout } from "../../services/api";
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

  const [missingGames, setMissingGames] = useState<number | null>(null);

  const handleGenerate = async () => {
    const unplayedCount = groupMatches.filter(m => m.score1 === null || m.score2 === null).length;
    if (unplayedCount > 0) {
      setMissingGames(unplayedCount);
      return;
    }

    setGenerating(true);
    try {
      await generateKnockout();
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
            if (updatedMatch.stage !== 'GROUP' && updatedMatch.score1 !== null && updatedMatch.score2 !== null) {
              loadMatches();
            }
          }).catch(err => console.error(`Erro ao salvar partida ${matchId}:`, err));
        }, 800);
      }
      
      return updatedMatches;
    });
  };

  const handleAutoComplete = () => {
    const unplayed = groupMatches.filter(m => m.score1 === null || m.score2 === null);
    if (unplayed.length === 0) return;

    const updatedMatches = matches.map(m => {
      if (m.stage === 'GROUP' && (m.score1 === null || m.score2 === null)) {
        return { 
          ...m, 
          score1: Math.floor(Math.random() * 4), 
          score2: Math.floor(Math.random() * 4) 
        };
      }
      return m;
    });

    setMatches(updatedMatches);
    
    // Save to backend
    unplayed.forEach(m => {
      const s1 = Math.floor(Math.random() * 4);
      const s2 = Math.floor(Math.random() * 4);
      updateMatchResult(m.id, s1, s2).catch(console.error);
    });
  };

  const handleSimulateKnockout = async () => {
    setGenerating(true);
    try {
      await simulateKnockout();
      loadMatches();
    } catch (error) {
      alert("Erro ao simular chaveamento.");
    } finally {
      setGenerating(false);
    }
  };

  const handleClearKnockout = async () => {
    setGenerating(true);
    try {
      await generateKnockout(); // Recria a árvore limpa
      loadMatches();
    } catch (error) {
      alert("Erro ao reiniciar chaveamento.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    alert("Funcionalidade de compartilhamento em breve!");
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

  return (
    <div className="pb-10 pt-10">
      
      {/* Toast / Modal de Alerta */}
      {missingGames !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-fifa-red/50 p-8 rounded-2xl max-w-md w-full shadow-[0_0_30px_rgba(255,0,77,0.2)] text-center">
            <span className="text-6xl mb-4 block drop-shadow-lg">⚠️</span>
            <h2 className="text-2xl font-black text-fifa-red mb-4 uppercase tracking-widest">Atenção</h2>
            <p className="text-slate-300 font-medium mb-8">
              Faltam <strong className="text-white text-xl mx-1">{missingGames}</strong> jogos para encerrar a fase de grupos. Preencha todos os placares antes de avançar para o mata-mata!
            </p>
            <button 
              onClick={() => setMissingGames(null)}
              className="px-8 py-3 bg-slate-800 hover:bg-fifa-red text-white font-bold rounded-full transition-colors uppercase tracking-wider w-full"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

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
            <KnockoutTree 
              matches={knockoutMatches} 
              onScoreChange={handleScoreChange} 
              onSimulateAll={handleSimulateKnockout}
              onClearAll={handleClearKnockout}
              onShare={handleShare}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center mt-10 w-full max-w-2xl">
            <div className="bg-slate-950/80 p-10 rounded-2xl border border-fifa-blue/30 w-full flex flex-col items-center shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <span className="text-5xl mb-4 block drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">🏆</span>
              <h3 className="text-2xl font-black text-fifa-blue mb-3 uppercase tracking-wider">Supercomputador FIFA</h3>
              <p className="text-slate-400 mb-8 font-medium">
                Quando a fase de grupos for concluída, clique no botão abaixo para calcular os classificados e gerar a árvore oficial das eliminatórias.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-8 py-4 bg-gradient-to-r from-fifa-purple to-fifa-blue hover:from-fifa-blue hover:to-fifa-green text-white font-black rounded-full shadow-[0_0_20px_rgba(122,0,255,0.4)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest flex-1 max-w-xs"
                >
                  {generating ? "Calculando..." : "Gerar Chaveamento"}
                </button>

                <button
                  onClick={handleAutoComplete}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full border border-slate-600 transition-colors uppercase tracking-widest flex-1 max-w-xs text-sm"
                >
                  🪄 Auto-Completar (DEV)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
