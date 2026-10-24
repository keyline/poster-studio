export type SourceNote = { id: string; label: string; text: string };

export type Competitor = {
  name: string;
  positioning: string;
  strengths: string;
  weaknesses: string;
  communicationStyle: string;
};

export type BrandStudy = {
  brandSummary: string;
  category: string;
  targetAudience: string[];
  brandPersonality: string[];
  toneOfVoice: string;
  visualIdentity: { colors: string[]; typography: string; imagery: string };
  usp: string[];
  competitors: Competitor[];
  marketGaps: string[];
  positioningOpportunities: string[];
  dos: string[];
  donts: string[];
  sources: string[];
  usedWebSearch: boolean;
  generatedAt: string;
};

export type BrandInput = {
  name: string;
  industry: string;
  location: string;
  description: string;
  website: string;
  facebook: string;
  instagram: string;
  otherLinks: string;
  competitorsHint: string;
  logo?: string;
};

export type Brand = BrandInput & {
  id: string;
  notes: SourceNote[];
  study?: BrandStudy;
  createdAt: string;
  updatedAt: string;
};

export type Idea = {
  title: string;
  appeals: string[];
  insight: string;
  bigIdea: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  tagline: string;
  visualConcept: string;
  rationale: string;
  doubleMeaning?: string; // the second reading of copy + visual, if any
  cdNote?: string; // what the Creative Director changed in review
  postCopy?: string; // social media caption to publish with the creative
};

export type Layout = {
  position: "top" | "bottom" | "left" | "right" | "center";
  tone: "light" | "dark";
  accent: string;
  font: "serif" | "sans" | "condensed";
  panel?: boolean; // copy on a solid panel beside/below the picture (default) instead of over it
  logoStyle?: "auto" | "original" | "white" | "black" | "badge";
};

export type Visual = {
  styleName: string;
  styleNote: string;
  artDirection: string; // the art director's layout spec the prompt was written from
  prompt: string;
  layout: Layout;
};

export type Team = {
  copywriter: string;
  artDirector: string;
  visualizer: string;
  photographer: string;
};

export type TextMode = "overlay" | "ai";
