import { Component } from '@angular/core';
import { GsapRevealDirective } from '../../directives/gsap-reveal.directive';
import { TopbarComponent } from "../../layout/components/topbar/topbar.component";

@Component({
  selector: 'app-blog-single',
  imports: [GsapRevealDirective, TopbarComponent],
  templateUrl: './blog-single.component.html',
  styles: ``
})
export class BlogSingleComponent {
  year = new Date().getFullYear()
}
