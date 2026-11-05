import Link from "next/link";
import { CheckSquare, ArrowRight, Zap, Shield, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800/80 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight">PulseTask</span>
        </div>

        <div className="flex items-center">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Production-Grade Task Management
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Capture clarity. <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">
            Execute at momentum.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          The high-velocity task management suite crafted for high-performance individuals and engineering teams. Subtasks, projects, smart filters, and zero bloat.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            <span>Start Free Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 border border-slate-800 transition-all"
          >
            Existing User Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <Zap className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Instant Speed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keyboard-first navigation with quick-add (Q) and optimistic offline-resilient task toggles.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <Layers className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Organized Projects</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Group related goals into Projects and Categories with fine-grained subtask breakdown.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <Shield className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Secure & Relational</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict user data isolation, bcrypt hashing, JWT session security, and PostgreSQL architecture.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © 2026 PulseTask. Production architecture for modern productivity.
      </footer>
    </div>
  );
}
