import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "TeamTaskPro — Know your team's work is getting done",
  description:
    "Assign work, track it, and see exactly who's on top of things. Task accountability built for small business teams.",
};

export default function HomePage() {
  return <Landing />;
}
