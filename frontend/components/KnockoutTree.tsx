import React from 'react';
import MatchCard, { Match } from './MatchCard';

interface KnockoutTreeProps {
  matches: Match[];
  onScoreChange: (matchId: number, team: 'team1' | 'team2', score: number | null, isPenalty?: boolean) => void;
}

export default function KnockoutTree({ matches, onScoreChange }: KnockoutTreeProps) {
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
    <div className="flex flex-col justify-around w-[30px] py-10">
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
    <div className="flex flex-col justify-around w-[30px] py-10">
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
    <div className="w-full mt-8 overflow-x-auto custom-scrollbar pb-8">
      <div className="flex flex-row min-w-[1600px] 2xl:min-w-full justify-between items-stretch gap-1 px-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-700/30">
        
        {/* Esquerda */}
        {renderColumn(leftR32, 'w-[200px]', 'gap-2', '16-AVOS')}
        {renderConnectorsLeft(4)}
        {renderColumn(leftR16, 'w-[200px]', 'gap-10', 'OITAVAS')}
        {renderConnectorsLeft(2)}
        {renderColumn(leftQF, 'w-[200px]', 'gap-28', 'QUARTAS')}
        {renderConnectorsLeft(1)}
        {renderColumn(leftSF, 'w-[200px]', 'gap-0', 'SEMIFINAL')}
        {renderConnectorsLeft(0.5)}

        {/* FINAL CENTRAL */}
        <div className="flex flex-col justify-center items-center w-[250px] relative px-2 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fifa-purple/10 to-transparent pointer-events-none rounded-full blur-3xl"></div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-blue via-fifa-purple to-fifa-red mb-6 drop-shadow-sm tracking-widest animate-pulse text-center">
            GRANDE FINAL
          </h2>
          {final.length > 0 && (
            <div className="w-full relative z-10 transform scale-110 shadow-[0_0_30px_rgba(122,0,255,0.2)] rounded-xl">
              <MatchCard match={final[0]} onScoreChange={onScoreChange} />
              {final[0].played && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                  <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">🏆</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direita */}
        {renderConnectorsRight(0.5)}
        {renderColumn(rightSF, 'w-[200px]', 'gap-0', 'SEMIFINAL')}
        {renderConnectorsRight(1)}
        {renderColumn(rightQF, 'w-[200px]', 'gap-28', 'QUARTAS')}
        {renderConnectorsRight(2)}
        {renderColumn(rightR16, 'w-[200px]', 'gap-10', 'OITAVAS')}
        {renderConnectorsRight(4)}
        {renderColumn(rightR32, 'w-[200px]', 'gap-2', '16-AVOS')}

      </div>
    </div>
  );
}
