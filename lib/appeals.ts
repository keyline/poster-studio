// Classic advertising appeals ("positioning styles"). Select one or more per poster.
export const APPEALS: { id: string; name: string; hint: string }[] = [
  { id: "fear", name: "Fear", hint: "What they risk losing or facing without it" },
  { id: "lust", name: "Lust / Desire", hint: "Sensual, irresistible craving" },
  { id: "greed", name: "Greed", hint: "More for less, savings, value, gain" },
  { id: "pride", name: "Pride / Status", hint: "Feel superior, admired, successful" },
  { id: "envy", name: "Envy", hint: "Others have it — you want it too" },
  { id: "sloth", name: "Sloth / Convenience", hint: "Effortless, saves time and hassle" },
  { id: "gluttony", name: "Gluttony / Indulgence", hint: "Treat yourself, pure excess" },
  { id: "wrath", name: "Wrath / Rebellion", hint: "Fight the status quo, break rules" },
  { id: "belonging", name: "Belonging", hint: "Be part of the tribe, family, community" },
  { id: "love", name: "Love & Care", hint: "Protect and delight the people you love" },
  { id: "nostalgia", name: "Nostalgia", hint: "The good old days, memories, heritage" },
  { id: "humor", name: "Humour", hint: "Make them smile, then remember" },
  { id: "curiosity", name: "Curiosity", hint: "Tease, intrigue, make them look twice" },
  { id: "aspiration", name: "Aspiration", hint: "Who they dream of becoming" },
  { id: "trust", name: "Trust & Safety", hint: "Reliable, proven, expert, safe choice" },
  { id: "urgency", name: "Urgency / FOMO", hint: "Limited time, don't miss out" },
  { id: "guilt", name: "Guilt", hint: "Do the right thing, make amends" },
];

export function appealNames(ids: string[]) {
  return APPEALS.filter((a) => ids.includes(a.id)).map((a) => `${a.name} (${a.hint})`);
}
