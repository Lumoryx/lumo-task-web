import type { Person } from "@/types/task";

/**
 * Seed people. The mock API loads these on first run and persists live
 * edits to `localStorage["lumo.tasks.v1"]` alongside tasks.
 *
 * These names match references already baked into SEED_TASKS (Maya, Pieter)
 * so the demo feels coherent out of the box.
 */
export const SEED_PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Maya Chen",
    initials: "MC",
    color: "#5bc8d4",
    email: "maya@stride.studio",
  },
  {
    id: "p2",
    name: "Pieter van Dijk",
    initials: "PD",
    color: "#a8e64b",
    email: "pieter@stride.studio",
  },
  {
    id: "p3",
    name: "Jordan Kim",
    initials: "JK",
    color: "#ffb347",
    email: "jordan@stride.studio",
  },
];

/** Preset color palette for new member avatars. */
export const PERSON_COLORS = [
  "#5bc8d4",
  "#a8e64b",
  "#ffb347",
  "#ff6b6b",
  "#c084fc",
  "#60a5fa",
  "#f472b6",
  "#34d399",
];
