import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Injectable({
  providedIn: 'root',
})
export class GsapService {
  constructor() {}

  animateReveal(container: HTMLElement): void {
    const image = container.querySelector('img');

    if (container && image) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          toggleActions: 'play none none none',
        },
      });

      tl.set(container, { autoAlpha: 1 });
      tl.from(container, 1.5, { xPercent: -100, ease: 'power2.out' });
      tl.from(image, 1.5, { xPercent: 100, scale: 1.3, delay: -1.5, ease: 'power2.out' });
    }
  }
}
