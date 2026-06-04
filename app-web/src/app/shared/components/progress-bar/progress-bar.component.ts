import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="w-full bg-[var(--q-surface-2)] rounded-full overflow-hidden" [style.height]="height()">
      <div class="h-full bg-[var(--q-accent)] rounded-full transition-all duration-500"
           [style.width]="widthPct()"></div>
    </div>
  `,
})
export class ProgressBarComponent {
  value  = input.required<number>();
  max    = input(100);
  height = input('6px');

  widthPct = computed(() => `${Math.min(100, (this.value() / this.max()) * 100)}%`);
}
