import { motion } from "framer-motion";
import {
  Shield,
  Target,
  Users,
  Code,
  Globe,
  Zap,
  ChevronRight,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import Squares from "@/components/backgrounds/Squares/Squares";

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30 font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[120px]" />
        <Squares
          direction="diagonal"
          speed={0.15}
          squareSize={40}
          borderColor="rgba(255,255,255,0.05)"
          hoverFillColor="rgba(245,158,11,0.1)"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-6">
            System Intelligence
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-medium tracking-tight mb-6">
            <span className="text-white">Games of the</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 mt-2">
              Generals
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            The ultimate tactical warfare simulation. Reimagined for the modern
            commander with real-time telemetry and advanced combat analytics.
          </p>
        </motion.div>

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            {
              icon: Target,
              title: "Strategic Depth",
              desc: "Engage in high-stakes mind games. Hidden ranks create a fog of war that rewards intuition and calculated risk.",
            },
            {
              icon: Zap,
              title: "Real-Time Action",
              desc: "Seamless synchronization for fluid combat. Execute commands instantly across our global server mesh.",
            },
            {
              icon: Code,
              title: "Modern Engineering",
              desc: "Built on high-performance infrastructure. Conway, React, and TanStack power a superior battlefield experience.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-amber-500/30">
                <item.icon className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-white/90">
                {item.title}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Developer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/30 backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Shield className="w-96 h-96" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 sm:p-12 lg:p-16 items-center">
            <div className="order-2 lg:order-1 space-y-8">
              <div>
                <h2 className="text-3xl font-display font-medium mb-4">
                  Architected by{" "}
                  <span className="text-amber-400">Gabriel Catimbang</span>
                </h2>
                <div className="h-1 w-20 bg-amber-500/50 rounded-full mb-6" />
                <p className="text-zinc-400 leading-relaxed mb-6">
                  "My mission was to preserve the strategic heritage of the
                  classic 'Game of the Generals' while elevating it with modern
                  digital innovation. This platform represents the convergence
                  of tactical tradition and cutting-edge web technology."
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 gap-2"
                  onClick={() =>
                    window.open(
                      "https://github.com/gab-cat/games-of-the-generals",
                      "_blank",
                    )
                  }
                >
                  <Github className="w-4 h-4" />
                  <span>Source Code</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 gap-2"
                  onClick={() =>
                    window.open(
                      "https://www.linkedin.com/in/gabriel-catimbang/",
                      "_blank",
                    )
                  }
                >
                  <Linkedin className="w-4 h-4 text-blue-400" />
                  <span>Connect</span>
                </Button>
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2"
                  onClick={() =>
                    window.open("mailto:gabriel.catimbang@gmail.com")
                  }
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </Button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="text-center space-y-4 p-8">
                  <Globe className="w-16 h-16 text-zinc-700 mx-auto mb-4 group-hover:text-amber-500/50 transition-colors duration-500" />
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                      System Version
                    </div>
                    <div className="text-2xl font-bold text-white">
                      v2.0.0-PROD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 text-center space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-medium">
            Ready to deploy?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-8 h-12 text-sm uppercase tracking-wide"
              onClick={() => navigate({ to: "/auth" })}
            >
              Initialize Account
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-zinc-400 hover:text-white hover:bg-white/5 px-8 h-12 text-sm uppercase tracking-wide gap-2 border border-white/5"
              onClick={() => navigate({ to: "/announcements" })}
            >
              Read Intel
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Footer info */}
        <div className="mt-32 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-zinc-600 uppercase tracking-widest gap-4">
          <div>© {new Date().getFullYear()} Games of the Generals</div>
          <div className="flex gap-6">
            <span
              className="cursor-pointer hover:text-zinc-400 transition-colors"
              onClick={() => navigate({ to: "/privacy" })}
            >
              Privacy
            </span>
            <span
              className="cursor-pointer hover:text-zinc-400 transition-colors"
              onClick={() => navigate({ to: "/terms" })}
            >
              Terms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
