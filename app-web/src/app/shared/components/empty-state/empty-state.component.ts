import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div class="text-5xl">{{ icon() }}</div>
      <h3 class="text-lg font-semibold text-[var(--q-fg)]">{{ title() }}</h3>
      @if (description()) {
        <p class="text-sm text-[var(--q-fg-2)] max-w-xs">{{ description() }}</p>
      }
      @if (ctaLabel()) {
        <button (click)="ctaClick.emit()"
                class="mt-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm hover:opacity-90 transition-opacity">
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon        = input('🔍');
  title       = input.required<string>();
  description = input('');
  ctaLabel    = input('');
  ctaClick    = output<void>();
}
