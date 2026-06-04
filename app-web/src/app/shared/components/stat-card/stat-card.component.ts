import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4 flex flex-col gap-1 border border-[var(--q-surface-2)]">
      <span class="text-xs text-[var(--q-fg-3)] font-medium uppercase tracking-wide">{{ label() }}</span>
      <div class="flex items-baseline gap-0.5">
        <span class="text-2xl font-bold font-display text-[var(--q-fg)]">{{ value() }}</span>
        @if (suffix()) {
          <span class="text-sm text-[var(--q-fg-2)]">{{ suffix() }}</span>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  label  = input.required<string>();
  value  = input.required<string | number>();
  suffix = input<string>('');
}
