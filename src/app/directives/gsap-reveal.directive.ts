import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { GsapService } from '../services/gsap.service';

@Directive({
  selector: '[appGsapReveal]', // Use this directive in templates
})
export class GsapRevealDirective implements AfterViewInit {
  constructor(private el: ElementRef, private gsapService: GsapService) {}

  ngAfterViewInit(): void {
    // Pass the current element to the GSAP animation service
    this.gsapService.animateReveal(this.el.nativeElement);
  }
}
