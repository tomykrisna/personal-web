import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';

@Component({
  selector: 'app-index5',
  imports: [],
  templateUrl: './index5.component.html',
  styles: ``
})
export class Index5Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area5');
  }
}
