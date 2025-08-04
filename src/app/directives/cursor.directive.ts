import { Directive, ElementRef, Renderer2, HostListener, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appCursor]'
})
export class CursorDirective implements AfterViewInit {
  private cursor!: HTMLElement;
  private cursorInner!: HTMLElement;
  private links!: NodeListOf<HTMLAnchorElement>;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    // Create custom cursor elements
    this.cursor = this.el.nativeElement.querySelector('.procus-cursor');
    this.cursorInner = this.el.nativeElement.querySelector('.procus-cursor2');
    this.links = this.el.nativeElement.querySelectorAll('a');
  }

  // Mouse move listener
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const { clientX: x, clientY: y } = event;
    if (this.cursor) {
      this.renderer.setStyle(this.cursor, 'transform', `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`);
    }
    if (this.cursorInner) {
      this.renderer.setStyle(this.cursorInner, 'left', `${x}px`);
      this.renderer.setStyle(this.cursorInner, 'top', `${y}px`);
    }
  }

  // Mouse down listener
  @HostListener('document:mousedown')
  onMouseDown() {
    if (this.cursor) this.renderer.addClass(this.cursor, 'click');
    if (this.cursorInner) this.renderer.addClass(this.cursorInner, 'cursorinnerhover');
  }

  // Mouse up listener
  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.cursor) this.renderer.removeClass(this.cursor, 'click');
    if (this.cursorInner) this.renderer.removeClass(this.cursorInner, 'cursorinnerhover');
  }

  // Mouse over links
  @HostListener('document:mouseover', ['$event.target'])
  onMouseOver(target: HTMLElement) {
    if (target.tagName === 'A' && this.cursor) {
      this.renderer.addClass(this.cursor, 'hover');
    }
  }

  // Mouse leave links
  @HostListener('document:mouseleave', ['$event.target'])
  onMouseLeave(target: HTMLElement) {
    if (target.tagName === 'A' && this.cursor) {
      this.renderer.removeClass(this.cursor, 'hover');
    }
  }
}
