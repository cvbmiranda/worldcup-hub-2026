import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-center">
      
      {/* Hero Section */}
      <div className="bg-slate-800/40 backdrop-blur-md p-10 md:p-16 rounded-3xl shadow-2xl border border-slate-700/50 max-w-4xl relative overflow-hidden group">
        
        {/* Glow Effects inside the card */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-400/30 transition-all duration-700 pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/20 blur-[100px] rounded-full group-hover:bg-fuchsia-400/30 transition-all duration-700 pointer-events-none"></div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter relative z-10">
          <span className="block text-slate-100 mb-2">Simulador Oficial da</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 drop-shadow-sm">
            Copa do Mundo 2026
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed relative z-10">
          Acompanhe o maior torneio da história com 48 seleções. Simule os placares da fase de grupos, veja a classificação atualizada em tempo real e avance para o mata-mata épico.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link 
            href="/grupos" 
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-black rounded-full text-lg tracking-wide shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center"
          >
            Acessar Fase de Grupos
          </Link>
          <Link 
            href="/simulador" 
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-full text-lg tracking-wide border border-slate-600 shadow-lg transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center"
          >
            Mata-Mata
          </Link>
        </div>

      </div>
      
      {/* Informative Badges */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">🌍</span>
          <h3 className="text-emerald-400 font-bold text-lg mb-2">48 Seleções</h3>
          <p className="text-slate-400 text-sm">O primeiro mundial com o novo formato expandido.</p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">📊</span>
          <h3 className="text-cyan-400 font-bold text-lg mb-2">Motor de Tabelas</h3>
          <p className="text-slate-400 text-sm">Cálculo de pontos, saldo e gols em tempo real.</p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">🏆</span>
          <h3 className="text-fuchsia-400 font-bold text-lg mb-2">Mata-Mata 16-avos</h3>
          <p className="text-slate-400 text-sm">Chaveamento complexo e emocionante até a final.</p>
        </div>
      </div>
      
    </div>
  );
}
