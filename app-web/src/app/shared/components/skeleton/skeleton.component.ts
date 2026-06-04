import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [style.height]="height()" [style.width]="width()"></div>
  `,
})
export class SkeletonComponent {
  height = input('1rem');
  width  = input('100%');
}
