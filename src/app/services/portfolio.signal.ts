import {computed, Injectable, signal} from "@angular/core";
import {Subject, takeUntil} from "rxjs";
import {FirebaseService} from './firebase.service';
import {Project, ResponsePortfolioDto} from './portfolio.dto';

const InitialState = {
  data$: {} as ResponsePortfolioDto,
  loaded$: false,
  loading$: false,
  error$: null,
}

@Injectable({
  providedIn: 'root'
})

export class PortfolioSignalService {
  private terminate$ = new Subject<void>();
  state = signal(InitialState);
  data$ = computed(() => this.state().data$);
  loaded$ = computed(() => this.state().loaded$);
  loading$ = computed(() => this.state().loading$);
  error$ = computed(() => this.state().error$);

  constructor(private firebaseService: FirebaseService) {

  }

  public getPortfolio() {
    return new Promise((resolve, reject) => {
      this.state.set({
        data$: {} as ResponsePortfolioDto,
        loaded$: false,
        loading$: true,
        error$: null,
      })

      this.firebaseService.getPortfolioProjects()
        .pipe(takeUntil(this.terminate$))
        .subscribe({
          next: (data) => {
            const mappedPortfolio = this.mapSeedCollectionToLegacyDto(data);
            this.state.set({
              data$: mappedPortfolio,
              loaded$: true,
              loading$: false,
              error$: null,
            })
            resolve(true)
          }, error: (error) => {
            this.state.set({
              data$: {} as ResponsePortfolioDto,
              loaded$: true,
              loading$: false,
              error$: error,
            })
            reject(error)
          }
        })
    })
  }

  destroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }

  private mapSeedCollectionToLegacyDto(seedProjects: any[]): ResponsePortfolioDto {
    if (!Array.isArray(seedProjects) || !seedProjects.length) {
      return {
        name: 'Portfolio',
        project: [],
        "3NGx21lNUmjVwy3DeRgW": ''
      };
    }

    const mappedProjects: Project[] = seedProjects
      .slice()
      .map((item) => ({
        rawItem: item,
        project: {
          name: String(item?.company ?? item?.name ?? ''),
          title: String(item?.title ?? ''),
          description: this.buildDescription(item),
          date: this.toLegacyDate(item),
          image: Array.isArray(item?.image) ? item.image : [],
          url: String(item?.url ?? ''),
          stack: Array.isArray(item?.stack) ? item.stack : []
        } as Project
      }))
      .sort((a, b) => {
        const aHighlighted = this.isHighlighted(a.rawItem);
        const bHighlighted = this.isHighlighted(b.rawItem);
        if (aHighlighted !== bHighlighted) {
          return aHighlighted ? -1 : 1;
        }

        const aSortMs = this.extractSortTimestampMs(a.rawItem);
        const bSortMs = this.extractSortTimestampMs(b.rawItem);
        if (!Number.isNaN(aSortMs) && !Number.isNaN(bSortMs)) {
          const dateDiff = bSortMs - aSortMs;
          if (dateDiff !== 0) {
            return dateDiff;
          }
        }

        return String(a.project?.title ?? '').localeCompare(String(b.project?.title ?? ''));
      })
      .map((item) => item.project);

    return {
      name: 'Portfolio',
      project: mappedProjects,
      "3NGx21lNUmjVwy3DeRgW": ''
    };
  }

  private toLegacyDate(item: any): {type: string; seconds: number; nanoseconds: number} {
    const selectedMs = this.extractSortTimestampMs(item);
    const seconds = Number.isNaN(selectedMs) ? Math.floor(Date.now() / 1000) : Math.floor(selectedMs / 1000);

    return {
      type: 'timestamp',
      seconds,
      nanoseconds: 0
    };
  }

  private extractSortTimestampMs(item: any): number {
    // Priority for sorting newest first:
    // 1) endDate (if exists)
    // 2) startDate (fallback when endDate is empty)
    // 3) date.seconds (legacy/firestore timestamp-like)
    // 4) date as ISO/string
    const endMs = item?.endDate ? Date.parse(String(item.endDate)) : NaN;
    if (!Number.isNaN(endMs)) {
      return endMs;
    }

    const startMs = item?.startDate ? Date.parse(String(item.startDate)) : NaN;
    if (!Number.isNaN(startMs)) {
      return startMs;
    }

    const dateSeconds = Number(item?.date?.seconds);
    if (Number.isFinite(dateSeconds) && dateSeconds > 0) {
      return dateSeconds * 1000;
    }

    const dateStringMs = item?.date ? Date.parse(String(item.date)) : NaN;
    if (!Number.isNaN(dateStringMs)) {
      return dateStringMs;
    }

    return NaN;
  }

  private isHighlighted(item: any): boolean {
    return Boolean(item?.highlightProject ?? item?.isFeatured ?? false);
  }

  private parseDateMs(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return NaN;
    }
    return Date.parse(String(value));
  }

  private buildDescription(item: any): string {
    const summary = String(item?.summary ?? '').trim();
    const description = String(item?.description ?? '').trim();

    if (summary && description && summary !== description) {
      return `<p>${summary}</p><p>${description}</p>`;
    }

    if (description) {
      return `<p>${description}</p>`;
    }

    if (summary) {
      return `<p>${summary}</p>`;
    }

    return '<p>No description available yet.</p>';
  }
}
