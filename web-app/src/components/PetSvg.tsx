import { DogSvg } from "@/components/DogSvg";
import { CatSvg } from "@/components/CatSvg";
import { FoxSvg } from "@/components/FoxSvg";
import { PandaSvg } from "@/components/PandaSvg";
import { RobotSvg } from "@/components/RobotSvg";

export type PetSpecies = "dog" | "cat" | "fox" | "panda" | "robot";

export const PET_SPECIES_LIST: { value: PetSpecies; emoji: string; labelEn: string; labelZh: string }[] = [
  { value: "dog",   emoji: "🐕", labelEn: "Dog",   labelZh: "狗" },
  { value: "cat",   emoji: "🐱", labelEn: "Cat",   labelZh: "猫" },
  { value: "fox",   emoji: "🦊", labelEn: "Fox",   labelZh: "狐狸" },
  { value: "panda", emoji: "🐼", labelEn: "Panda", labelZh: "熊猫" },
  { value: "robot", emoji: "🤖", labelEn: "Robot", labelZh: "机器人" },
];

export function getSpeciesEmoji(species: PetSpecies): string {
  return PET_SPECIES_LIST.find((s) => s.value === species)?.emoji ?? "🐕";
}

interface PetSvgProps {
  species?: PetSpecies;
  mood: string;
  size?: number;
  level?: number;
}

export function PetSvg({ species = "dog", mood, size = 64, level = 1 }: PetSvgProps) {
  switch (species) {
    case "dog":   return <DogSvg mood={mood} size={size} level={level} />;
    case "cat":   return <CatSvg mood={mood} size={size} />;
    case "fox":   return <FoxSvg mood={mood} size={size} />;
    case "panda": return <PandaSvg mood={mood} size={size} />;
    case "robot": return <RobotSvg mood={mood} size={size} />;
    default:      return <DogSvg mood={mood} size={size} level={level} />;
  }
}
