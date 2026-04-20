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
  @Input() set projects(value: Project[] | null | undefined) {
    const normalizedProjects = value ?? [];
    this.mappedProjects = normalizedProjects.map((project, index) => mapProjectToViewModel(project, index));
    this.rebuildColumns();
  }

  mappedProjects: PortfolioProjectViewModel[] = [];
  groupedProjects: PortfolioProjectViewModel[][] = [];
  @Output() projectSelected = new EventEmitter<PortfolioProjectViewModel>();
  private currentColumnCount = this.resolveColumnCount();

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

  private rebuildColumns(): void {
    const columns = Array.from({length: this.currentColumnCount}, () => [] as PortfolioProjectViewModel[]);

    this.mappedProjects.forEach((project, index) => {
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
