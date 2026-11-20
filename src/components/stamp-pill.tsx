import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Direct access to completed goals and logged wins, without a currency balance. */
export function StampPill() {
  return (
    <Link to="/gallery" aria-label="Open My Moongrove wins" title="My Moongrove wins"
      className={buttonVariants({ variant: "ghost", size: "icon" })}>
      <Trophy className="size-5" />
    </Link>
  );
}
