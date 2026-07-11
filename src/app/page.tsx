import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "TaskTeamPro — Finally. An honest planner.",
  description:
    "Spoken capture, smart scheduling, and accountability insights that keep you on track. Plan visually. Live realistically.",
};

export default function HomePage() {
  return <Landing />;
}
