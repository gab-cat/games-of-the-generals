import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function EmailPreviewPage() {
  const [type, setType] = useState<
    "ban" | "mute" | "unban" | "unmute" | "reset"
  >("ban");
  const data = useQuery(api.emailPreview.getEmailPreview, { type });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-amber-500">
              Comms /// Preview
            </h1>
            <div className="flex gap-2">
              {(["ban", "mute", "unban", "unmute", "reset"] as const).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-2 text-sm uppercase tracking-wider border transition-all ${
                      type === t
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">
            Protocol: Verified
          </div>
        </div>

        {/* HTML Preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              HTML Output
            </h2>
            <span className="text-xs text-zinc-600">Rendered View</span>
          </div>
          <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-[3/4] relative group">
            {data ? (
              <iframe
                srcDoc={data.html}
                className="w-full h-full bg-white"
                title="Email Preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                Loading...
              </div>
            )}
            {/* Overlay for dark mode check awareness - since email is dark mode, iframe bg should be dark ideally if supporting dark mode clients, usually emails default to white if not specified, but our template sets bg.
                  Our template sets body bg to #09090b. But iframe default is white. 
                  However, standard valid HTML includes body bg.
              */}
          </div>
        </div>

        {/* Text Preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Text Output
            </h2>
            <span className="text-xs text-zinc-600">Plain Text Fallback</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 h-full font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-auto aspect-[3/4]">
            {data ? data.text : "Loading..."}
          </div>
        </div>
      </div>
    </div>
  );
}
