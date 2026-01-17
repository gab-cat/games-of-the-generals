import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "@/auth/SignInForm";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

function AdminLayoutComponent() {
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});
  const navigate = useNavigate();
  const isAdmin = profile?.adminRole;

  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {!isAdmin ? (
          <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
            <Card className="bg-zinc-900/40 backdrop-blur-xl border border-red-500/20 shadow-[0_0_50px_-10px_rgba(239,68,68,0.2)] max-w-md mx-4 relative z-10">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-sm border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-medium text-white mb-2 tracking-wide">
                  RESTRICTED ACCESS
                </h2>
                <p className="text-zinc-500 font-mono text-xs mb-6 leading-relaxed">
                  Clearance Level Insufficient. This area is restricted to
                  Command Staff only.
                </p>
                <div className="text-[10px] text-red-500/60 font-mono uppercase tracking-widest border-t border-red-500/10 pt-4">
                  Violation Protocol Active
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans relative flex flex-col">
            {/* Background Grid & Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 pointer-events-none">
              <div className="max-w-[1920px] mx-auto h-full px-6 flex items-center justify-between">
                <div className="pointer-events-auto bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-display leading-none">
                    Command<span className="text-zinc-600">Console</span>
                  </span>
                </div>

                <div className="pointer-events-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: "/" })}
                    className="bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-full text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white h-9 px-4 hover:bg-white/10 transition-all shadow-2xl"
                  >
                    <ChevronLeft className="w-3 h-3 mr-2" />
                    Return to Field
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 flex flex-col min-h-screen">
              {/* Main Content */}
              <main className="flex-1 relative z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-zinc-950/0 to-zinc-950/0 pt-20">
                <div className="max-w-[1920px] mx-auto p-6 lg:p-10">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        )}
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminLayoutComponent,
});
