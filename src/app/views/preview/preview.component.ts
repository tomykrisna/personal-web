import { Component, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-preview',
  imports: [RouterLink],
  templateUrl: './preview.component.html',
  styles: ``
})
export class PreviewComponent {
  isSidebarVisible: boolean = false;
  isOverlayActive: boolean = false;
  year = new Date().getFullYear()
  constructor(private renderer: Renderer2) {}

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
