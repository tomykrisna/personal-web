import {Component, HostListener, OnInit, Renderer2} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {GsapRevealDirective} from '../../../directives/gsap-reveal.directive';
import {CommonModule} from '@angular/common';
import {ClassManagerService} from '../../../services/classmanaer.service';
import {ScrollToModule, ScrollToService} from '@nicky-lenaers/ngx-scroll-to'
import aos from 'aos';
import {CounterDirective} from '../../../directives/counter.directive';
import {PortfolioSignalService} from '../../../services/portfolio.signal';
import {Project} from '../../../services/portfolio.dto';
import {FirebaseTimestampPipe} from '../../../pipes/firebasetimestamp.pipe';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Button} from 'primeng/button';
import {GalleriaModule} from 'primeng/galleria';
import {Image} from 'primeng/image';

@Component({
  selector: 'app-sidebar',
  imports: [
    GsapRevealDirective,
    CounterDirective,
    CommonModule,
    RouterOutlet,
    ScrollToModule,
    RouterLink,
    FirebaseTimestampPipe,
    FormsModule,
    Button,
    GalleriaModule,
    Image,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [ScrollToService],
})
export class SidebarComponent implements OnInit {
  currentSection = 'list-item-1';
  year = new Date().getFullYear();
  isModelOpen: boolean = false;
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

  portfolioDetail: Project = {
    name: '',
    image: [],
    date: {
      nanoseconds: 0,
      seconds: 0,
      type: ''
    },
    description: '',
    url: '',
    title: '',
    stack: []

  }

  descriptionDetail!: SafeHtml

  emailText = ''
  currentIndex = 0;

  responsiveOptions: any[] = [
    {
      breakpoint: '991px',
      numVisible: 4
    },
    {
      breakpoint: '767px',
      numVisible: 3
    },
    {
      breakpoint: '575px',
      numVisible: 1
    }
  ];

  constructor(
    private renderer: Renderer2,
    public classManager: ClassManagerService,
    public portfolioSignalService: PortfolioSignalService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    aos.init();
    this.portfolioSignalService.getPortfolio()
  }

  openModel(data: Project) {
    this.portfolioDetail = data
    this.descriptionDetail = this.sanitizer.bypassSecurityTrustHtml(data.description)
    this.isModelOpen = true;
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

  closeModel() {
    this.isModelOpen = false;
  }

  setActiveLink(sectionId: string): void {
    this.currentSection = sectionId;
  }


  prevSlide() {
    const total = this.portfolioDetail.image.length;
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateSlider();
    }
  }

  nextSlide() {
    const total = this.portfolioDetail.image.length;
    if (this.currentIndex < total - 1) {
      this.currentIndex++;
      this.updateSlider();
    }
  }

  updateSlider() {
    const slider = document.getElementById('imageSlider');
    if (slider) {
      const width = slider.clientWidth;
      slider.style.transform = `translateX(-${this.currentIndex * width}px)`;
    }
  }


  sendEmail() {
    const email = 'tommykrisna7@gmail.com';
    const mailto = `mailto:${email}?body=${encodeURIComponent(this.emailText)}`;
    window.open(mailto, '_blank');
  }
}
