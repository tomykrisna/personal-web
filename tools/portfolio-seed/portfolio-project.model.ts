export type PortfolioRole =
  | 'Tech Lead'
  | 'Project Manager'
  | 'Fullstack Developer'
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Mobile Developer'
  | 'Software Developer';

export interface PortfolioProjectSeed {
  slug: string;
  title: string;
  company: string;
  role: PortfolioRole;
  periodLabel: string;
  startDate: string;
  endDate?: string;
  highlightProject?: boolean;
  isFeatured: boolean;
  order: number;
  stack: string[];
  summary: string;
  description: string;
  image: string[];
  imageFolder?: string;
  url?: string;
}

export interface PortfolioProjectDocument extends PortfolioProjectSeed {
  createdAt: string;
  updatedAt: string;
  source: 'seed';
}
