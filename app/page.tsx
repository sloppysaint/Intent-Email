import SignInCard from "./components/SignInCard";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Gradient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500 opacity-20 rounded-full blur-3xl animate-pulse -z-10" />
        
        {/* Secondary Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-2xl animate-bounce -z-10" style={{animationDuration: '6s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500 opacity-15 rounded-full blur-2xl animate-bounce -z-10" style={{animationDuration: '8s', animationDelay: '2s'}} />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-pulse -z-10" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header Content */}
      <div className="flex flex-col items-center mb-16 z-10 animate-fade-in-up">
        {/* Logo/Badge */}
        <div className="mb-6 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-500/30">
            <span className="text-sm font-medium text-cyan-300 tracking-wide">✨ AI-Powered Email Intelligence</span>
          </div>
        </div>

        {/* Main Title */}
        <div className="relative group mb-6">
          <span className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 tracking-tight drop-shadow-2xl leading-tight block animate-gradient-x bg-[length:400%_400%] hover:scale-105 transition-transform duration-300 cursor-default">
            Inbox Insight AI
          </span>
          
          {/* Subtle underline effect */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full group-hover:w-3/4 transition-all duration-500" />
        </div>

        {/* Subtitle */}
        <div className="max-w-2xl text-center space-y-2 animate-fade-in-up animation-delay-200">
          <p className="text-2xl md:text-3xl text-gray-200 font-semibold mb-3">
            Your Gmail, Reimagined.
          </p>
          <p className="text-lg text-gray-400 leading-relaxed px-4">
            Transform your inbox chaos into organized insights with 
            <span className="text-cyan-300 font-medium"> AI-powered intent detection</span> and 
            <span className="text-indigo-300 font-medium"> smart summarization</span>.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in-up animation-delay-400">
          {['Smart Categorization', 'Auto-Summarize', 'Priority Detection', 'Time Saver'].map((feature, index) => (
            <div 
              key={feature}
              className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/60 hover:border-cyan-500/30 hover:text-cyan-300 transition-all duration-300 cursor-default hover:scale-105"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Sign In Card */}
      <div className="animate-fade-in-up animation-delay-600 z-10">
        <SignInCard />
      </div>

      {/* Enhanced Footer */}
      <footer className="w-full flex flex-col items-center gap-2 text-gray-500 text-xs z-10 mt-5 pb-4">
        <div className="text-center">
          © {new Date().getFullYear()} Inbox Insight AI. Built with Next.js + OpenRouter.
        </div>
      </footer>


      {/* Global styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes gradient-x {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }

          .animate-gradient-x {
            animation: gradient-x 3s ease infinite;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-400 {
            animation-delay: 0.4s;
          }

          .animation-delay-600 {
            animation-delay: 0.6s;
          }
        `
      }} />
    </main>
  );
}