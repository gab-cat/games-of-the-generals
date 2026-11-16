import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { riseIn } from "../lib/motion";

function NotFoundComponent() {
  return (
    <motion.div
      {...riseIn}
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-10 text-center"
    >
      <p className="text-5xl font-medium tabular-nums text-gold-400">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-base text-foreground/90">
        This address doesn't lead anywhere. The link may be wrong, or the page
        has moved.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg">
          <Link to="/" search={{ lobbyId: undefined }}>
            Back to lobbies
          </Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => window.history.back()}
        >
          <ArrowLeft />
          Go back
        </Button>
      </div>
    </motion.div>
  );
}

export const Route = createFileRoute("/$")({
  component: NotFoundComponent,
});
