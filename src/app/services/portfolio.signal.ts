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
      .map((item, index) => ({
        originalIndex: index,
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
        const aOrder = Number(a.rawItem?.order ?? Number.MAX_SAFE_INTEGER);
        const bOrder = Number(b.rawItem?.order ?? Number.MAX_SAFE_INTEGER);
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.originalIndex - b.originalIndex;
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

  /**
   * Builds HTML for the detail modal. `summary` / `description` in Firestore or seed JSON may be:
   * - HTML fragments (e.g. `<p>…</p>`, `<strong>`, `<a href="…">`) — passed through (Angular sanitizes on bind)
   * - Plain text — escaped and wrapped in paragraphs; double newlines become separate `<p>` blocks
   */
  private buildDescription(item: any): string {
    const summary = String(item?.summary ?? '').trim();
    const description = String(item?.description ?? '').trim();
    const summaryPlain = this.plainTextForCompare(summary);
    const descriptionPlain = this.plainTextForCompare(description);

    if (summaryPlain && descriptionPlain && summaryPlain !== descriptionPlain) {
      return this.asHtmlFragment(summary) + this.asHtmlFragment(description);
    }

    if (description) {
      return this.asHtmlFragment(description);
    }

    if (summary) {
      return this.asHtmlFragment(summary);
    }

    return '<p>No description available yet.</p>';
  }

  private plainTextForCompare(htmlOrText: string): string {
    return String(htmlOrText ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** If the string already looks like HTML, return as-is; otherwise treat as plain text. */
  private asHtmlFragment(raw: string): string {
    const t = String(raw ?? '').trim();
    if (!t) {
      return '';
    }
    if (/^<[a-zA-Z!?]/.test(t)) {
      return t;
    }
    const blocks = t.split(/\n\s*\n/).filter(Boolean);
    if (blocks.length > 1) {
      return blocks
        .map((block) => `<p>${this.escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
        .join('');
    }
    return `<p>${this.escapeHtml(t).replace(/\n/g, '<br />')}</p>`;
  }
}
