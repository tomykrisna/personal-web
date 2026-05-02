import {AfterViewInit, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {GsapRevealDirective} from '../../../directives/gsap-reveal.directive';
import {CommonModule} from '@angular/common';
import {ClassManagerService} from '../../../services/classmanaer.service';
import {ScrollToModule, ScrollToService} from '@nicky-lenaers/ngx-scroll-to'
import aos from 'aos';
import {CounterDirective} from '../../../directives/counter.directive';
import {PortfolioSignalService} from '../../../services/portfolio.signal';
import {FormsModule} from '@angular/forms';
import {PortfolioSectionComponent} from '../portfolio-section/portfolio-section.component';
import {PortfolioDetailModalComponent} from '../portfolio-detail-modal/portfolio-detail-modal.component';
import {PortfolioProjectViewModel} from '../../../services/portfolio.mapper';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-sidebar',
  imports: [
    GsapRevealDirective,
    CounterDirective,
    CommonModule,
    RouterOutlet,
    ScrollToModule,
    FormsModule,
    PortfolioSectionComponent,
    PortfolioDetailModalComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [ScrollToService],
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  currentSection = 'list-item-1';
  year = new Date().getFullYear();
  private readonly refreshAosAndScrollTrigger = (): void => {
    aos.refresh();
    ScrollTrigger.refresh();
  };
  private readonly onPageShowPersisted = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      this.refreshAosAndScrollTrigger();
    }
  };
  sectionIds = [
    'list-item-1',
    'list-item-2',
    'list-item-3',
    'list-item-4',
    'list-item-5',
    // 'list-item-6',
    // 'list-item-7',
    'list-item-8',
  ];

  emailText = ''
  selectedPortfolioProject: PortfolioProjectViewModel | null = null;
  private lockedScrollContainer: HTMLElement | null = null;

  constructor(
    public classManager: ClassManagerService,
    public portfolioSignalService: PortfolioSignalService
  ) {
  }

  ngOnInit() {
    aos.init({
      once: true,
      duration: 800,
      offset: 120,
      easing: 'ease-out',
      debounceDelay: 50,
      throttleDelay: 99
    });
    this.portfolioSignalService.getPortfolio();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.refreshAosAndScrollTrigger());
    setTimeout(() => this.refreshAosAndScrollTrigger(), 150);
    window.addEventListener('pageshow', this.onPageShowPersisted);
  }

  ngOnDestroy(): void {
    window.removeEventListener('pageshow', this.onPageShowPersisted);
    document.body.style.overflow = '';
    this.unlockBackgroundScroll();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.checkActiveSection();
  }

  checkActiveSection(): void {
    for (let id of this.sectionIds) {
      const section = document.getElementById(id);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 3) {
          this.currentSection = id;
          break; // Stop checking once we find the first visible section
        }
      }
    }
  }

  setActiveLink(sectionId: string): void {
    this.currentSection = sectionId;
  }

  openPortfolioDetail(project: PortfolioProjectViewModel): void {
    this.selectedPortfolioProject = project;
    document.body.style.overflow = 'hidden';
    this.lockBackgroundScroll();
  }

  closePortfolioDetail(): void {
    this.selectedPortfolioProject = null;
    document.body.style.overflow = '';
    this.unlockBackgroundScroll();
  }

  sendEmail() {
    const email = 'tommykrisna7@gmail.com';
    const mailto = `mailto:${email}?body=${encodeURIComponent(this.emailText)}`;
    window.open(mailto, '_blank');
  }

  private lockBackgroundScroll(): void {
    const container = document.querySelector('.scrollspy-example') as HTMLElement | null;

    if (!container) {
      return;
    }

    this.lockedScrollContainer = container;
    this.lockedScrollContainer.style.overflow = 'hidden';
  }

  private unlockBackgroundScroll(): void {
    if (!this.lockedScrollContainer) {
      return;
    }

    this.lockedScrollContainer.style.overflow = '';
    this.lockedScrollContainer = null;
  }
}
