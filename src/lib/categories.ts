export const CATEGORY_META = {
  process: { label: "Process", color: "bg-category-process/10 text-category-process border-category-process/20" },
  people: { label: "People", color: "bg-category-people/10 text-category-people border-category-people/20" },
  tool: { label: "Tool", color: "bg-category-tool/10 text-category-tool border-category-tool/20" },
  strategy: { label: "Strategy", color: "bg-category-strategy/10 text-category-strategy border-category-strategy/20" },
} as const;

export type Category = keyof typeof CATEGORY_META;

export const RECO_TYPE_META = {
  process: { label: "Process fix", color: "bg-category-process/10 text-category-process" },
  training: { label: "People / training", color: "bg-category-people/10 text-category-people" },
  tool: { label: "Tool", color: "bg-category-tool/10 text-category-tool" },
  phased: { label: "Phased plan", color: "bg-category-strategy/10 text-category-strategy" },
} as const;
