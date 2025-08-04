import { CommonModule } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToModule, ScrollToService } from '@nicky-lenaers/ngx-scroll-to';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink,CommonModule,ScrollToModule],
  templateUrl: './topbar.component.html',
  styles: ``,
    providers: [ScrollToService],
})
export class TopbarComponent {
  isLightMode: boolean = false; // Tracks the current theme mode
  isSidebarVisible: boolean = false;
  isOverlayActive: boolean = false;
  currentSection = 'list-item-1';
  constructor(private renderer: Renderer2){}
  ngOnInit() {
    // Check the saved theme in localStorage and initialize the theme
    const savedTheme = localStorage.getItem('theme');
    this.isLightMode = savedTheme === 'light';
    this.updateBodyClass(); // Apply the saved theme on page load
  }

  toggleTheme(event: Event) {
    this.isLightMode = (event.target as HTMLInputElement).checked;
    localStorage.setItem('theme', this.isLightMode ? 'light' : 'dark');
    this.updateBodyClass();
  }

  updateBodyClass() {
    if (this.isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }

  
  setActiveLink(link: string): void {
    this.currentSection = link
  }


  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.isOverlayActive = this.isSidebarVisible;

    if (this.isSidebarVisible) {
      this.renderer.addClass(document.body, 'on-side');
    } else {
      this.renderer.removeClass(document.body, 'on-side');
    }
  }

  closeSidebar() {
    this.isSidebarVisible = false;
    this.isOverlayActive = false;
    this.renderer.removeClass(document.body, 'on-side');
  }
}
