import SignInCard from "./components/SignInCard";


export default function Home() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center relative">
      {/* Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500 opacity-20 rounded-full blur-3xl -z-10" />
      <div className="flex flex-col items-center mb-12">
        <span className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-indigo-500 tracking-tight drop-shadow-lg">
          Inbox Insight AI
        </span>
        <p className="mt-4 text-xl text-gray-300 max-w-xl text-center drop-shadow">
          Your Gmail, Reimagined.<br />
          Summarize and organize with AI-powered intent detection.
        </p>
      </div>
      <SignInCard />
      <footer className="absolute bottom-4 left-0 right-0 flex justify-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Inbox Insight AI. Built with Next.js + OpenRouter.
      </footer>
    </main>
  );
}
