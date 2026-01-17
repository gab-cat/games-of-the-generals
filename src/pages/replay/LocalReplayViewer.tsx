import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileJson, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "@tanstack/react-router";

// Type for the replay data we expect to receive
export interface LocalReplayData {
  version: string;
  exportedAt: string;
  player1Username: string;
  player2Username: string;
  initialBoard: unknown[][];
  moves: unknown[];
  gameMetadata: {
    createdAt: number;
    duration: number;
    moveCount: number;
    isWin: boolean;
    isDraw: boolean;
    reason: string;
  };
}

interface LocalReplayViewerProps {
  onReplayLoaded: (data: LocalReplayData) => void;
}

export function LocalReplayViewer({ onReplayLoaded }: LocalReplayViewerProps) {
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const validateReplayData = (data: unknown): data is LocalReplayData => {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;

    return (
      typeof obj.version === "string" &&
      typeof obj.player1Username === "string" &&
      typeof obj.player2Username === "string" &&
      Array.isArray(obj.initialBoard) &&
      Array.isArray(obj.moves) &&
      typeof obj.gameMetadata === "object" &&
      obj.gameMetadata !== null
    );
  };

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);

      if (!file.name.endsWith(".json")) {
        setError("Invalid file type. Please upload a JSON file.");
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!validateReplayData(data)) {
          setError(
            "Invalid replay file format. File is missing required fields.",
          );
          return;
        }

        onReplayLoaded(data);
      } catch {
        setError(
          "Failed to parse JSON file. Please check that the file is valid.",
        );
      }
    },
    [onReplayLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleBack = () => {
    void navigate({ to: "/match-history" });
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase mb-4">
          <Upload className="w-4 h-4" />
          <span>Local Replay Loader</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight mb-2">
          Import <span className="text-white/20">Replay</span>
        </h1>
        <p className="text-white/50 text-sm font-mono">
          Upload a previously downloaded replay file to view the match
        </p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-xl"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative p-12 rounded-sm border-2 border-dashed transition-all duration-300 cursor-pointer
            ${
              isDragActive
                ? "border-blue-500 bg-blue-500/10"
                : error
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }
          `}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20" />

          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                ${isDragActive ? "bg-blue-500/20" : "bg-white/5"}
              `}
            >
              <FileJson
                className={`w-8 h-8 ${isDragActive ? "text-blue-400" : "text-white/40"}`}
              />
            </div>

            <p className="text-white/80 font-medium mb-2">
              {isDragActive
                ? "Drop your replay file here"
                : "Drag & drop your replay file"}
            </p>
            <p className="text-white/40 text-sm font-mono mb-4">
              or click to browse
            </p>

            {fileName && !error && (
              <div className="flex items-center gap-2 text-sm text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded border border-blue-500/20">
                <FileJson className="w-4 h-4" />
                {fileName}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 font-mono bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-white/40 hover:text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Match History
        </Button>
      </motion.div>
    </div>
  );
}
