import { useState } from "react";
import { useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Button } from "../components/ui/button";
import ImageBackground from "../components/backgrounds/ImageBackground";
import Squares from "../components/backgrounds/Squares/Squares";

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  
  const createProfile = useConvexMutationWithQuery(api.profiles.createOrUpdateProfile, {
    onSuccess: () => {
      toast.success("Profile created successfully!");
    },
    onError: (error) => {
      console.error("Profile creation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create profile");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    createProfile.mutate({ username: username.trim() });
  };

  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden">
      {/* Mobile Background */}
      <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <div className="absolute inset-0">
          <ImageBackground overlayOpacity={0.6} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-gray-900/80 to-slate-950/95" />
      </div>

      {/* Left Side - Premium Design Section */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full lg:w-1/2 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden lg:block hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Image Background */}
        <div className="absolute inset-0">
          <ImageBackground overlayOpacity={0.4} leftFeatherOnly={true} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-gray-900/70 to-slate-900/90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-12 max-w-2xl min-h-screen lg:min-h-full">
          <motion.div 
            className="space-y-6 lg:space-y-10 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Logo/Icon */}
            <motion.div 
              className="flex items-center space-x-3 lg:space-x-4"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-2xl">
                <User className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="text-white/40 font-mono text-xs lg:text-sm tracking-wider">
                COMMANDER PROFILE
              </div>
            </motion.div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 bg-clip-text text-transparent leading-tight">
                Create Your
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                Legacy
              </h1>
              <div className="w-16 lg:w-24 h-1 bg-gradient-to-r from-slate-400 to-gray-500 mt-4"></div>
            </div>
            
            {/* Platform Description */}
            <div className="space-y-4 lg:space-y-6 text-white/80 font-body max-w-lg">
              <p className="text-sm lg:text-base font-body font-light leading-relaxed">
                Join a community of strategic minds in the premier platform for tactical warfare gaming.
              </p>
              
              <div className="space-y-3 lg:space-y-4 hidden sm:block">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Real-time Battles</h3>
                    <p className="text-xs lg:text-sm text-white/70">Engage in live matches with players from around the globe, no waiting.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Skill-based Ranking</h3>
                    <p className="text-xs lg:text-sm text-white/70">Climb the leaderboards with our advanced ELO rating system.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Match History</h3>
                    <p className="text-xs lg:text-sm text-white/70">Analyze every move with detailed game replays and statistics.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Platform Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">24/7</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Online Play</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">∞</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Skill Growth</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">Global</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Community</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Elements - Hidden on mobile */}
        <motion.div 
          className="absolute top-20 left-20 w-2 h-2 bg-slate-400 rounded-full opacity-40 hidden lg:block"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-32 left-32 w-1 h-1 bg-gray-400 rounded-full opacity-30 hidden lg:block"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-40 right-40 w-1.5 h-1.5 bg-slate-300 rounded-full opacity-35 hidden lg:block"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </motion.div>

      {/* Right Side - Profile Setup Form */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full lg:left-1/2 lg:w-1/2 flex items-center justify-center z-10 overflow-hidden"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        {/* Squares Background for Right Side */}
        <div className="absolute inset-0 opacity-30">
          <Squares 
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(148, 163, 184, 0.3)"
            squareSize={60}
            hoverFillColor="rgba(148, 163, 184, 0.1)"
          />
        </div>
        
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8 py-8 lg:py-0 min-h-screen lg:min-h-full flex flex-col justify-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-2 lg:space-y-3">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white">
                Create Your Profile
              </h2>
              <p className="text-white/60 text-base lg:text-lg font-body">
                Choose your commander name and join the ranks of legendary strategists
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 lg:space-y-6">
              <div className="space-y-4 lg:space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-white/90 font-body">
                    Commander Name
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body text-sm lg:text-base"
                    placeholder="Enter your battle name"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  <p className="text-xs text-white/50 font-mono">
                    3-20 characters. This will be your identity on the battlefield.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createProfile.isPending || !username.trim()}
                className="w-full bg-gradient-to-r from-slate-600 via-gray-600 to-slate-600 hover:from-slate-700 hover:via-gray-700 hover:to-slate-700 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-slate-500/25 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] font-body text-sm lg:text-base"
              >
                {createProfile.isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Profile...</span>
                  </div>
                ) : (
                  "Begin Your Journey"
                )}
              </Button>
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
