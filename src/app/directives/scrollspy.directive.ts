import { Directive, Input, EventEmitter, Output, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[scrollSpy]',
})
export class ScrollSpyDirective {
  @Input() public spiedTags: string[] = []; // Specify type for spiedTags
  @Output() public sectionChange = new EventEmitter<string>();
  private currentSection: string = ''; // Initialize with an empty string

  constructor(private _el: ElementRef) {}

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void { // Use 'Event' as the type for scroll event
    let currentSection: string | undefined; // Allow 'undefined' for cases where no section matches
    const children: HTMLCollection = this._el.nativeElement.children;
    const scrollTop: number = (event.target as HTMLElement).scrollTop;
    const parentOffset: number = (event.target as HTMLElement).offsetTop;

    for (let i = 0; i < children.length; i++) {
      const element = children[i] as HTMLElement;
      if (this.spiedTags.some((spiedTag) => spiedTag === element.tagName)) {
        if ((element.offsetTop - parentOffset) <= scrollTop) {
          currentSection = element.id;
        }
      }
    }

    if (currentSection && currentSection !== this.currentSection) {
      this.currentSection = currentSection;
      this.sectionChange.emit(this.currentSection); // Emit the updated section
      console.log('Updated current section:', this.currentSection);
    }
  }
}
