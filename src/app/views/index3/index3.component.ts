import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';

@Component({
  selector: 'app-index3',
  imports: [],
  templateUrl: './index3.component.html',
  styles: ``
})
export class Index3Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area3');
  }
}
