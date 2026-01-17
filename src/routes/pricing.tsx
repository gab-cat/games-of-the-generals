import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

import { SetupPage } from "../pages/setup/00.setup-page";
import { PricingPage } from "../pages/pricing/00.pricing-page";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";

function PricingComponent() {
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile);

  return (
    <>
      <Authenticated>
        {!profile ? <SetupPage /> : <PricingPage profile={profile} />}
      </Authenticated>
      <Unauthenticated>
        <PricingPage profile={null} />
      </Unauthenticated>
    </>
  );
}

export const Route = createFileRoute("/pricing")({
  component: PricingComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      donation: (search.donation as string | undefined) || undefined,
    };
  },
});
