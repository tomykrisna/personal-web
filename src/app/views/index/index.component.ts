import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';

@Component({
  selector: 'app-index',
  imports: [],
  templateUrl: './index.component.html',
  styles: ``
})
export class IndexComponent {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area');
  }
}
