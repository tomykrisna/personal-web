import {Project} from './portfolio.dto';

export interface PortfolioProjectViewModel {
  id: string;
  name: string;
  title: string;
  displayTitle: string;
  formattedDate: string;
  coverImage: string;
  galleryImages: string[];
  description: string;
  shortDescription: string;
  stack: string[];
  url: string;
}

const FALLBACK_IMAGE = 'assets/img/all-images/portfolio/portfolio-img1.png';

export function mapProjectToViewModel(project: Project, index: number): PortfolioProjectViewModel {
  const seconds = project?.date?.seconds ?? 0;
  const displayTitle = project.title?.trim() || project.name?.trim() || 'Untitled Project';
  const cleanedDescription = project.description?.trim() ?? '';
  const shortDescription = stripHtml(cleanedDescription).slice(0, 140).trim();

  return {
    id: `${displayTitle}-${index}`,
    name: project.name?.trim() ?? '',
    title: project.title?.trim() ?? '',
    displayTitle,
    formattedDate: toFormattedDate(seconds),
    coverImage: project.image?.[0]?.trim() || FALLBACK_IMAGE,
    galleryImages: (project.image ?? []).filter((image) => !!image?.trim()),
    description: cleanedDescription,
    shortDescription: shortDescription ? `${shortDescription}${shortDescription.length >= 140 ? '...' : ''}` : '',
    stack: (project.stack ?? []).filter((stack) => !!stack?.trim()),
    url: project.url?.trim() ?? ''
  };
}

function toFormattedDate(seconds: number): string {
  if (!seconds) {
    return 'Date unavailable';
  }

  const date = new globalThis.Date(seconds * 1000);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
