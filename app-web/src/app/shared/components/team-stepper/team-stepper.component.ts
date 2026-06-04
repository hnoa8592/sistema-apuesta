import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-team-stepper',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex flex-col items-center gap-3">
      <div class="flex items-center gap-1 text-[var(--q-fg-3)] text-xs font-medium uppercase tracking-wide">
        @if (flagUrl()) {
          <img [src]="flagUrl()" [alt]="teamName()" class="w-6 h-4 object-cover rounded-sm" />
        } @else {
          <span class="w-6 h-4 bg-[var(--q-surface-2)] rounded-sm flex items-center justify-center text-[8px] font-bold">
            {{ teamCode() }}
          </span>
        }
        <span class="truncate max-w-[80px]">{{ teamName() }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button (click)="decrement()" [disabled]="disabled() || value() <= 0"
                class="w-10 h-10 rounded-full border-2 border-[var(--q-fg-2)] flex items-center justify-center text-lg font-bold text-[var(--q-fg)] hover:border-[var(--q-accent)] hover:text-[var(--q-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          −
        </button>
        <span class="w-12 text-center text-3xl font-bold font-display text-[var(--q-fg)] tabular-nums">
          {{ value() }}
        </span>
        <button (click)="increment()" [disabled]="disabled() || value() >= 9"
                class="w-10 h-10 rounded-full border-2 border-[var(--q-fg-2)] flex items-center justify-center text-lg font-bold text-[var(--q-fg)] hover:border-[var(--q-accent)] hover:text-[var(--q-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          +
        </button>
      </div>
    </div>
  `,
})
export class TeamStepperComponent {
  teamName = input.required<string>();
  teamCode = input('???');
  flagUrl  = input<string | undefined>(undefined);
  disabled = input(false);
  value    = model(0);
  changed  = output<number>();

  increment() {
    if (this.value() < 9) {
      this.value.set(this.value() + 1);
      this.changed.emit(this.value());
    }
  }

  decrement() {
    if (this.value() > 0) {
      this.value.set(this.value() - 1);
      this.changed.emit(this.value());
    }
  }
}
