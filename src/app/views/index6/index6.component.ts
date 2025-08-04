import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';

@Component({
  selector: 'app-index6',
  imports: [],
  templateUrl: './index6.component.html',
  styles: ``
})
export class Index6Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area5');
  }
}
