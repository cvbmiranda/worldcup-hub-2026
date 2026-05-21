import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorldCup Hub 2026",
  description: "Simulador da Copa do Mundo 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${outfit.className} bg-slate-950 text-slate-200 min-h-screen custom-scrollbar selection:bg-fifa-green selection:text-slate-950`}>
        {/* Barra de Navegação Superior */}
        <nav className="bg-slate-950/80 backdrop-blur-xl text-white p-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-fifa-purple/30 sticky top-0 z-50">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center max-w-7xl gap-4 md:gap-0">
            <Link href="/" className="text-2xl font-black tracking-widest flex items-center gap-2 group">
              <span className="text-3xl group-hover:rotate-12 transition-transform duration-300">⚽</span> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fifa-blue to-fifa-green">WorldCup</span> 
              <span className="text-fifa-purple font-black">2026</span>
            </Link>

            <div className="flex space-x-2 sm:space-x-6 font-bold text-sm sm:text-base tracking-wide">
              <Link href="/grupos" className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-fifa-green hover:shadow-[0_0_15px_rgba(207,249,0,0.3)] transition-all duration-300">Fase de Grupos</Link>
              <Link href="/simulador" className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-fifa-blue hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300">Mata-Mata</Link>
              <Link href="/ranking" className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-fifa-purple hover:shadow-[0_0_15px_rgba(122,0,255,0.3)] transition-all duration-300">Ranking</Link>
            </div>
          </div>
        </nav>

        {/* Conteúdo dinâmico das páginas vai renderizar aqui dentro */}
        <main className="container mx-auto p-4 mt-6 max-w-7xl relative z-10">
          {children}
        </main>
        
        {/* Background glow effects - FIFA 2026 E-Sports Vibe */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-fifa-purple/15 blur-[150px] mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fifa-blue/15 blur-[150px] mix-blend-screen"></div>
          <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-fifa-orange/10 blur-[150px] mix-blend-screen"></div>
          <div className="absolute top-[20%] right-[30%] w-[20vw] h-[20vw] rounded-full bg-fifa-green/10 blur-[100px] mix-blend-screen"></div>
        </div>
      </body>
    </html>
  );
}