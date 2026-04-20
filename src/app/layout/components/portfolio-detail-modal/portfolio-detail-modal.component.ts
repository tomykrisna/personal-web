import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {PortfolioProjectViewModel} from '../../../services/portfolio.mapper';

@Component({
  selector: 'app-portfolio-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-detail-modal.component.html',
  styleUrl: './portfolio-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioDetailModalComponent {
  @Input() project: PortfolioProjectViewModel | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  get hasExternalLink(): boolean {
    return !!this.project?.url && /^https?:\/\//i.test(this.project.url);
  }

  get extraGalleryImages(): string[] {
    return this.project?.galleryImages.slice(1) ?? [];
  }

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }
}
