import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';
@Component({
  selector: 'app-index2',
  imports: [],
  templateUrl: './index2.component.html',
  styles: ``
})
export class Index2Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area2');
  }
}
