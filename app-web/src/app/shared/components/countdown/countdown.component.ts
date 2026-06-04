import { Component, input, output, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="classes()" class="font-mono tabular-nums">
      {{ display() }}
    </span>
  `,
})
export class CountdownComponent implements OnInit, OnDestroy {
  targetDate  = input.required<Date | string>();
  size        = input<'sm' | 'md' | 'lg'>('md');
  expired     = output<void>();

  private remaining = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  display = computed(() => {
    const s = this.remaining();
    if (s <= 0) return '00:00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  });

  isExpiring = computed(() => this.remaining() > 0 && this.remaining() < 300);

  classes = computed(() => {
    const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-4xl font-bold' };
    const color = this.remaining() <= 0
      ? 'text-[var(--q-fg-3)]'
      : this.isExpiring()
        ? 'text-[var(--q-danger)] animate-blink'
        : 'text-[var(--q-danger)]';
    return `${sizes[this.size()]} ${color}`;
  });

  ngOnInit() {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private tick() {
    const target = new Date(this.targetDate()).getTime();
    const diff = Math.floor((target - Date.now()) / 1000);
    this.remaining.set(Math.max(0, diff));
    if (diff <= 0) {
      if (this.timer) clearInterval(this.timer);
      this.expired.emit();
    }
  }
}
