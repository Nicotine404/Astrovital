import type { Metadata } from "next";
import { CrewBoard } from "@/components/crew/crew-board";

export const metadata: Metadata = { title: "Tripulación" };

export default function CrewPage() {
  return <CrewBoard />;
}
