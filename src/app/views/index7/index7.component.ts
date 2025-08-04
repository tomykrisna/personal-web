import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';
import { SidebarComponent } from "../../layout/components/sidebar/sidebar.component";

@Component({
  selector: 'app-index7',
  imports: [SidebarComponent],
  templateUrl: './index7.component.html',
  styles: ``
})
export class Index7Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area7');
  }
}
