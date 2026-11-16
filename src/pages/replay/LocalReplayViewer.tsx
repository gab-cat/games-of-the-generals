import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileJson, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/ui/page-header";
import { riseIn } from "../../lib/motion";
import { cn } from "../../lib/utils";
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
        setError("That is not a replay file. Choose a .json file.");
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!validateReplayData(data)) {
          setError("This file is not a replay from Games of the Generals.");
          return;
        }

        onReplayLoaded(data);
      } catch {
        setError("This file could not be read. Download the replay again.");
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
    <div>
      <PageHeader
        title="Load a replay"
        description="Choose a replay file you downloaded from Match history."
        actions={
          <Button variant="secondary" onClick={handleBack}>
            <ArrowLeft />
            Match history
          </Button>
        }
      />

      <motion.div {...riseIn} className="max-w-xl">
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex cursor-pointer flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center transition-colors",
            "focus-within:ring-2 focus-within:ring-ring/70 focus-within:ring-offset-2 focus-within:ring-offset-background",
            isDragActive
              ? "border-gold-500/60 bg-gold-500/10"
              : error
                ? "border-red-500/50 bg-red-500/5"
                : "border-border-strong bg-card hover:bg-white/[0.04]",
          )}
        >
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="sr-only"
          />

          <p className="text-base font-medium text-foreground">
            {isDragActive
              ? "Drop the file to open it"
              : "Drop a replay file here"}
          </p>
          <p className="mt-1 text-sm text-foreground/80">
            Replay files end in .json.
          </p>
          <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            <Upload className="size-4" />
            Choose file
          </span>

          {fileName && !error && (
            <p className="mt-4 flex items-center gap-2 break-all text-sm text-foreground">
              <FileJson className="size-4 shrink-0" />
              {fileName}
            </p>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-foreground"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
