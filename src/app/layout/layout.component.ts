import { Component } from '@angular/core';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { TopbarComponent } from "./components/topbar/topbar.component";
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [TopbarComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styles: ``
})
export class LayoutComponent {

}
