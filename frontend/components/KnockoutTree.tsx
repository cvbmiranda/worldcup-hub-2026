import React from 'react';
import MatchCard, { Match } from './MatchCard';

interface KnockoutTreeProps {
  matches: Match[];
  onScoreChange: (matchId: number, team: 'team1' | 'team2', score: number | null, isPenalty?: boolean) => void;
  onSimulateAll?: () => void;
  onClearAll?: () => void;
  onShare?: () => void;
}

export default function KnockoutTree({ matches, onScoreChange, onSimulateAll, onClearAll, onShare }: KnockoutTreeProps) {
  const r32 = matches.filter(m => m.stage === 'ROUND_32').sort((a, b) => a.id - b.id);
  const r16 = matches.filter(m => m.stage === 'ROUND_16').sort((a, b) => a.id - b.id);
  const qf = matches.filter(m => m.stage === 'QUARTER').sort((a, b) => a.id - b.id);
  const sf = matches.filter(m => m.stage === 'SEMI').sort((a, b) => a.id - b.id);
  const final = matches.filter(m => m.stage === 'FINAL').sort((a, b) => a.id - b.id);

  if (r32.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 font-medium">
        Nenhum jogo do mata-mata gerado ainda.
      </div>
    );
  }

  let finalWinner: typeof final[0]['team1'] | null = null;
  const finalMatch = final.length > 0 ? final[0] : null;

  if (finalMatch && finalMatch.score1 !== null && finalMatch.score2 !== null && finalMatch.team1 && finalMatch.team2) {
    if (finalMatch.score1 > finalMatch.score2) {
      finalWinner = finalMatch.team1;
    } else if (finalMatch.score2 > finalMatch.score1) {
      finalWinner = finalMatch.team2;
    } else if (finalMatch.penalties_score1 != null && finalMatch.penalties_score2 != null) {
      if (finalMatch.penalties_score1! > finalMatch.penalties_score2!) {
        finalWinner = finalMatch.team1;
      } else if (finalMatch.penalties_score2! > finalMatch.penalties_score1!) {
        finalWinner = finalMatch.team2;
      }
    }
  }

  // Divisão das chaves (Esquerda e Direita)
  const leftR32 = r32.slice(0, 8);
  const rightR32 = r32.slice(8, 16);

  const leftR16 = r16.slice(0, 4);
  const rightR16 = r16.slice(4, 8);

  const leftQF = qf.slice(0, 2);
  const rightQF = qf.slice(2, 4);

  const leftSF = sf.slice(0, 1);
  const rightSF = sf.slice(1, 2);

  const renderConnectorsLeft = (count: number) => (
    <div className="flex flex-col justify-around w-[8px] py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center w-full">
          <svg className="w-full h-1/2 text-slate-600/50 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M 0,0 L 50,0 L 50,100 L 0,100 M 50,50 L 100,50" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      ))}
    </div>
  );

  const renderConnectorsRight = (count: number) => (
    <div className="flex flex-col justify-around w-[8px] py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center w-full">
          <svg className="w-full h-1/2 text-slate-600/50 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M 100,0 L 50,0 L 50,100 L 100,100 M 50,50 L 0,50" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      ))}
    </div>
  );

  const renderColumn = (columnMatches: Match[], width: string, gap: string, title?: string) => (
    <div className={`flex flex-col justify-around ${width} ${gap} py-4 relative z-10`}>
      {title && <h3 className="text-center text-fifa-blue font-black text-xs tracking-widest mb-2 uppercase">{title}</h3>}
      {columnMatches.map(match => (
        <div key={match.id} className="relative w-full">
          <MatchCard match={match} onScoreChange={onScoreChange} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full mt-8 overflow-hidden flex flex-col items-center pb-8">
      <div className="transform scale-95 origin-top flex flex-row w-max justify-center items-stretch gap-0.5 px-1 bg-slate-900/40 p-1.5 rounded-3xl border border-slate-700/30">
        
        {/* Esquerda */}
        {renderColumn(leftR32, 'w-[120px]', 'gap-0', '16-AVOS')}
        {renderConnectorsLeft(4)}
        {renderColumn(leftR16, 'w-[120px]', 'gap-2', 'OITAVAS')}
        {renderConnectorsLeft(2)}
        {renderColumn(leftQF, 'w-[120px]', 'gap-6', 'QUARTAS')}
        {renderConnectorsLeft(1)}
        {renderColumn(leftSF, 'w-[120px]', 'gap-0', 'SEMIFINAL')}
        {renderConnectorsLeft(0.5)}

        {/* FINAL CENTRAL */}
        <div className="flex flex-col justify-center items-center w-[140px] relative px-1 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fifa-purple/10 to-transparent pointer-events-none rounded-full blur-3xl"></div>
          
          {finalWinner ? (
            <div className="flex flex-col items-center justify-center animate-in zoom-in duration-500 w-full mb-4 z-20">
              <div className="relative mb-2">
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                <img 
                  src={finalWinner.flag_url} 
                  alt={finalWinner.name} 
                  className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] object-cover relative z-10"
                />
                <div className="absolute -bottom-2 -right-2 text-3xl animate-bounce z-20 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">🏆</div>
              </div>
              <h3 className="text-xl font-bold text-white text-center drop-shadow-md truncate w-full px-1">
                {finalWinner.name}
              </h3>
              <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-1 drop-shadow-sm tracking-widest text-center uppercase">
                CAMPEÃO!
              </h2>
            </div>
          ) : (
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-blue via-fifa-purple to-fifa-red mb-3 drop-shadow-sm tracking-widest animate-pulse text-center z-10">
              FINAL
            </h2>
          )}

          {finalMatch && (
            <div className={`w-full relative z-10 transform ${finalWinner ? 'scale-90 opacity-80 hover:opacity-100 hover:scale-95 transition-all' : 'scale-105 shadow-[0_0_30px_rgba(122,0,255,0.2)]'} rounded-xl`}>
              <MatchCard match={finalMatch} onScoreChange={onScoreChange} />
              {!finalWinner && finalMatch.played && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                  <span className="text-3xl drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">🏆</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direita */}
        {renderConnectorsRight(0.5)}
        {renderColumn(rightSF, 'w-[120px]', 'gap-0', 'SEMIFINAL')}
        {renderConnectorsRight(1)}
        {renderColumn(rightQF, 'w-[120px]', 'gap-6', 'QUARTAS')}
        {renderConnectorsRight(2)}
        {renderColumn(rightR16, 'w-[120px]', 'gap-2', 'OITAVAS')}
        {renderConnectorsRight(4)}
        {renderColumn(rightR32, 'w-[120px]', 'gap-0', '16-AVOS')}

      </div>

      {/* Action Bar */}
      <div className="flex gap-4 justify-center mt-8">
        {onSimulateAll && (
          <button 
            onClick={onSimulateAll}
            className="px-6 py-2 bg-fifa-green text-slate-900 font-bold rounded-lg hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(0,255,166,0.3)]"
          >
            🎲 Simular Mata-Mata
          </button>
        )}
        {onClearAll && (
          <button 
            onClick={onClearAll}
            className="px-6 py-2 bg-slate-900/80 border border-fifa-red/50 text-fifa-red font-bold rounded-lg hover:bg-fifa-red hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,77,0.2)]"
          >
            🗑️ Reiniciar
          </button>
        )}
        {onShare && (
          <button 
            onClick={onShare}
            className="px-6 py-2 bg-slate-900/80 border border-fifa-blue/50 text-fifa-blue font-bold rounded-lg hover:bg-fifa-blue hover:text-slate-900 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            🔗 Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}
