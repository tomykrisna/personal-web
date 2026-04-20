import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {PortfolioProjectViewModel} from '../../../services/portfolio.mapper';

@Component({
  selector: 'app-portfolio-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-card.component.html',
  styleUrl: './portfolio-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioCardComponent {
  @Input({required: true}) project!: PortfolioProjectViewModel;
  @Output() viewDetails = new EventEmitter<PortfolioProjectViewModel>();

  onOpenDetails(): void {
    this.viewDetails.emit(this.project);
  }
}
