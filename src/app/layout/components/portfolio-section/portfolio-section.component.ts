import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Project} from '../../../services/portfolio.dto';
import {mapProjectToViewModel, PortfolioProjectViewModel} from '../../../services/portfolio.mapper';
import {PortfolioCardComponent} from '../portfolio-card/portfolio-card.component';

@Component({
  selector: 'app-portfolio-section',
  standalone: true,
  imports: [CommonModule, PortfolioCardComponent],
  templateUrl: './portfolio-section.component.html',
  styleUrl: './portfolio-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioSectionComponent {
  private readonly pageSize = 12;

  @Input() set projects(value: Project[] | null | undefined) {
    const normalizedProjects = value ?? [];
    this.mappedProjects = normalizedProjects.map((project, index) => mapProjectToViewModel(project, index));
    this.currentPage = 1;
    this.updatePagination();
  }

  mappedProjects: PortfolioProjectViewModel[] = [];
  pagedProjects: PortfolioProjectViewModel[] = [];
  groupedProjects: PortfolioProjectViewModel[][] = [];
  @Output() projectSelected = new EventEmitter<PortfolioProjectViewModel>();
  private currentColumnCount = this.resolveColumnCount();
  currentPage = 1;
  totalPages = 1;

  openProject(project: PortfolioProjectViewModel): void {
    this.projectSelected.emit(project);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const nextColumnCount = this.resolveColumnCount();
    if (nextColumnCount !== this.currentColumnCount) {
      this.currentColumnCount = nextColumnCount;
      this.rebuildColumns();
    }
  }

  trackByProjectId(_: number, project: PortfolioProjectViewModel): string {
    return project.id;
  }

  trackByColumnIndex(index: number): number {
    return index;
  }

  trackByPage(page: number): number {
    return page;
  }

  get pageNumbers(): number[] {
    return Array.from({length: this.totalPages}, (_, idx) => idx + 1);
  }

  get canGoPrev(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.updatePagination();
  }

  goPrevPage(): void {
    if (!this.canGoPrev) {
      return;
    }
    this.currentPage -= 1;
    this.updatePagination();
  }

  goNextPage(): void {
    if (!this.canGoNext) {
      return;
    }
    this.currentPage += 1;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.mappedProjects.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedProjects = this.mappedProjects.slice(start, end);
    this.rebuildColumns();
  }

  private rebuildColumns(): void {
    const columns = Array.from({length: this.currentColumnCount}, () => [] as PortfolioProjectViewModel[]);

    this.pagedProjects.forEach((project, index) => {
      columns[index % this.currentColumnCount].push(project);
    });

    this.groupedProjects = columns;
  }

  private resolveColumnCount(): number {
    if (typeof window === 'undefined') {
      return 3;
    }

    if (window.innerWidth <= 767) {
      return 1;
    }

    if (window.innerWidth <= 1199) {
      return 2;
    }

    return 3;
  }
}
