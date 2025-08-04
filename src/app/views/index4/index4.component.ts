import { Component } from '@angular/core';
import { ClassManagerService } from '../../services/classmanaer.service';
@Component({
  selector: 'app-index4',
  imports: [],
  templateUrl: './index4.component.html',
  styles: ``
})
export class Index4Component {
  constructor(private classManager: ClassManagerService) {
    this.classManager.setClass('main-hero-area3');
  }
}
