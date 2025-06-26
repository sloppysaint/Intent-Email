"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Zap, Users, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignInCard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl px-10 py-12 flex items-center justify-center min-w-[380px] border border-gray-700/50 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
          <span className="text-gray-400 text-sm">Loading your experience...</span>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl px-10 py-12 flex items-center justify-center min-w-[380px] border border-green-500/30 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <ArrowRight className="text-green-400" size={24} />
          </div>
          <span className="text-green-400 text-sm font-medium">Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data stays safe with enterprise-grade security"
  },
  {
    icon: Zap,
    title: "Powerful Actions",
    description: "Delete, archive, or star emails directly from your dashboard for lightning-fast email management."
  }
];


  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main card */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden min-w-[420px] hover:border-cyan-500/30 transition-all duration-300">
        {/* Animated border */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-indigo-500/20 animate-pulse" />
        </div>

        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              Ready to transform your inbox?
            </h2>
            <p className="text-gray-400 text-sm animate-fade-in animation-delay-100">
              Get started in less than 30 seconds
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group/feature animate-fade-in"
                style={{ animationDelay: `${200 + index * 100}ms` }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  hoveredFeature === index 
                    ? 'bg-cyan-500/20 text-cyan-400 scale-110' 
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  <feature.icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full relative group/btn overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-2xl shadow-xl text-lg transition-all duration-300 focus:ring-2 ring-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in animation-delay-500"
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 rounded-2xl" />
              
              {/* Button content */}
              <div className="relative flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg width={24} height={24} viewBox="0 0 48 48" className="group-hover/btn:scale-110 transition-transform duration-300">
                      <g>
                        <path fill="#4285F4" d="M44.5 20H24v8.5h11.7c-1 4.1-5 6.6-11.7 6.6-7 0-12.7-5.7-12.7-12.7S17 9.7 24 9.7c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5 12.3.5 3 9.8 3 21.5 3 33.2 12.3 42.5 24 42.5c10.8 0 21-8.4 21-21 0-1.4-.2-2.5-.5-3.5z"/>
                        <path fill="#34A853" d="M6.9 14.5l7 5.2C15.3 17 19.2 13.5 24 13.5c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5c-6.2 0-11.7 2.5-15.6 6.5z"/>
                        <path fill="#FBBC05" d="M24 42.5c5.8 0 11.2-2 15.4-5.3l-7.2-5.9c-2.1 1.4-4.8 2.2-8.2 2.2-5.7 0-10.4-3.8-12-9z"/>
                        <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.4 4.5-5.7 7.6-11.7 7.6-7 0-12.7-5.7-12.7-12.7S17 9.7 24 9.7c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5 12.3.5 3 9.8 3 21.5 3 33.2 12.3 42.5 24 42.5c10.8 0 21-8.4 21-21 0-1.4-.2-2.5-.5-3.5z"/>
                      </g>
                    </svg>
                    <span className="group-hover/btn:translate-x-0.5 transition-transform duration-300">
                      Continue with Google
                    </span>
                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </div>
            </button>

            
          </div>

          {/* Bottom text */}
          <div className="mt-6 text-center animate-fade-in animation-delay-700">
            
            <p className="text-xs text-gray-600 mt-2">
              We never store your email data. Processing happens in real-time.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
}