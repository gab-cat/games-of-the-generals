import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import Aurora from "./backgrounds/Aurora/Aurora";

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createProfile = useMutation(api.profiles.createOrUpdateProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      await createProfile({ username: username.trim() });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Premium Design Section */}
      <motion.div 
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Aurora Background */}
        <div className="absolute inset-0 opacity-25">
          <Aurora 
            colorStops={["#475569", "#64748B", "#94A3B8"]}
            blend={0.3}
            amplitude={0.7}
            speed={0.2}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-gray-900/70 to-slate-900/90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-12 max-w-2xl">
          <motion.div 
            className="space-y-10 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Logo/Icon */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="text-white/40 font-mono text-sm tracking-wider">
                COMMANDER PROFILE
              </div>
            </motion.div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 bg-clip-text text-transparent leading-tight">
                Create Your
              </h1>
              <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                Legacy
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-slate-400 to-gray-500 mt-4"></div>
            </div>
            
            {/* Platform Description */}
            <div className="space-y-6 text-white/80 font-body max-w-lg">
              <p className="text-xl leading-relaxed">
                Join a community of strategic minds in the premier platform for tactical warfare gaming.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Real-time Battles</h3>
                    <p className="text-sm text-white/70">Engage in live matches with players from around the globe, no waiting.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Skill-based Ranking</h3>
                    <p className="text-sm text-white/70">Climb the leaderboards with our advanced ELO rating system.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Match History</h3>
                    <p className="text-sm text-white/70">Analyze every move with detailed game replays and statistics.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Secure Platform</h3>
                    <p className="text-sm text-white/70">Military-grade encryption ensures fair play and data protection.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Platform Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div>
                <div className="text-2xl font-display font-bold text-white">24/7</div>
                <div className="text-sm text-white/60 font-body">Online Play</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-white">∞</div>
                <div className="text-sm text-white/60 font-body">Skill Growth</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-white">Global</div>
                <div className="text-sm text-white/60 font-body">Community</div>
              </div>
            </motion.div>
            
            {/* Quote */}
            <motion.div 
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <p className="text-white/70 italic font-body text-base leading-relaxed">
                "Every expert was once a beginner. Every winner was once a loser. Every champion was once a contender that refused to give up."
              </p>
              <p className="text-white/50 text-sm mt-3 font-mono">— Military Strategy Proverb</p>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-24 left-24 w-3 h-3 bg-slate-400 rounded-full opacity-30"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-40 left-20 w-2 h-2 bg-gray-400 rounded-full opacity-25"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />
        <motion.div 
          className="absolute top-32 right-32 w-1.5 h-1.5 bg-slate-300 rounded-full opacity-35"
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Right Side - Profile Setup Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div className="w-full max-w-md px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <User className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-white">Create Your Profile</h2>
              <p className="text-white/60 text-lg leading-relaxed font-body">
                Choose your commander name and join the ranks of legendary strategists
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="username" className="block text-sm font-medium text-white/90 font-body">
                  Commander Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body"
                  placeholder="Enter your battle name"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-white/50 font-mono">
                  3-20 characters. This will be your identity on the battlefield.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || !username.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-slate-600 via-gray-600 to-slate-600 hover:from-slate-700 hover:via-gray-700 hover:to-slate-700 text-white py-3 px-6 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-slate-500/25 transform disabled:transform-none font-body"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Profile...</span>
                  </div>
                ) : (
                  "Begin Your Journey"
                )}
              </motion.button>
            </form>

            {/* Additional Info */}
            <motion.div 
              className="text-center space-y-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <div className="flex items-center justify-center space-x-6 text-sm text-white/50">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span>Ready</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
