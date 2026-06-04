import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from '../../../core/models';
import { AvatarComponent } from '../avatar/avatar.component';
import { PillComponent } from '../pill/pill.component';

@Component({
  selector: 'app-leader-row',
  standalone: true,
  imports: [CommonModule, AvatarComponent, PillComponent],
  template: `
    <div [class]="rowClasses()">
      <!-- Position -->
      <div class="w-8 text-center shrink-0">
        @if (entry().position === 1) { <span class="text-xl">🥇</span> }
        @else if (entry().position === 2) { <span class="text-xl">🥈</span> }
        @else if (entry().position === 3) { <span class="text-xl">🥉</span> }
        @else {
          <span class="text-sm font-bold text-[var(--q-fg-2)]">{{ entry().position }}</span>
        }
      </div>

      <!-- Avatar -->
      <app-avatar [name]="entry().name" [pictureUrl]="entry().pictureUrl" size="sm" />

      <!-- Name & stats -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-[var(--q-fg)] truncate">{{ entry().name }}</span>
          @if (entry().isCurrentUser) { <app-pill label="TÚ" variant="accent" /> }
        </div>
        <span class="text-xs text-[var(--q-fg-3)]">
          {{ entry().exactPredictions }} exactos · {{ entry().correctResults }} aciertos
        </span>
      </div>

      <!-- Trend -->
      <div class="w-8 text-center shrink-0">
        @if (entry().positionTrend > 0) {
          <span class="text-green-500 text-xs font-bold">↑{{ entry().positionTrend }}</span>
        } @else if (entry().positionTrend < 0) {
          <span class="text-[var(--q-danger)] text-xs font-bold">↓{{ -entry().positionTrend }}</span>
        } @else {
          <span class="text-[var(--q-fg-3)] text-xs">—</span>
        }
      </div>

      <!-- Points -->
      <div class="w-12 text-right shrink-0">
        <span class="text-lg font-bold font-display text-[var(--q-fg)]">{{ entry().totalPoints }}</span>
        <span class="text-xs text-[var(--q-fg-3)] block">pts</span>
      </div>
    </div>
  `,
})
export class LeaderRowComponent {
  entry = input.required<LeaderboardEntry>();

  rowClasses() {
    const base = 'flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors';
    return this.entry().isCurrentUser
      ? `${base} bg-[var(--q-accent-soft)] border-l-4 border-[var(--q-accent)]`
      : `${base} hover:bg-[var(--q-surface-2)]`;
  }
}
