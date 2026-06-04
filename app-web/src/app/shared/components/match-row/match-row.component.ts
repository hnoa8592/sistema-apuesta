import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match, STAGE_LABEL } from '../../../core/models';
import { PillComponent } from '../pill/pill.component';
import { CountdownComponent } from '../countdown/countdown.component';

@Component({
  selector: 'app-match-row',
  standalone: true,
  imports: [CommonModule, PillComponent, CountdownComponent],
  template: `
    <div (click)="rowClick.emit(match())"
         class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4 cursor-pointer hover:bg-[var(--q-surface-2)] transition-colors border border-transparent hover:border-[var(--q-surface-2)]">

      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-[var(--q-fg-3)]">
          {{ stageLabel() }} · J{{ match().matchDay }}
        </span>
        @if (match().status === 'IN_PROGRESS') {
          <app-pill label="EN VIVO" variant="live" />
        } @else if (match().status === 'FINISHED') {
          <app-pill label="Finalizado" variant="default" />
        } @else if (deadlineDate()) {
          <app-countdown [targetDate]="deadlineDate()!" size="sm" (expired)="rowExpired.emit()" />
        }
      </div>

      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-1">
          @if (match().homeTeam.flagUrl) {
            <img [src]="match().homeTeam.flagUrl" [alt]="match().homeTeam.name" class="w-7 h-5 object-cover rounded-sm" />
          } @else {
            <span class="w-7 h-5 bg-[var(--q-surface-2)] rounded-sm flex items-center justify-center text-[9px] font-bold">
              {{ match().homeTeam.shortName }}
            </span>
          }
          <span class="text-sm font-semibold text-[var(--q-fg)] truncate">{{ match().homeTeam.name }}</span>
        </div>

        <div class="flex items-center gap-1 px-2 font-mono font-bold text-xl text-[var(--q-fg)] tabular-nums shrink-0">
          @if (match().status === 'FINISHED' || match().status === 'IN_PROGRESS') {
            <span>{{ match().homeScore ?? '?' }}</span>
            <span class="text-[var(--q-fg-3)] text-sm">–</span>
            <span>{{ match().awayScore ?? '?' }}</span>
          } @else {
            <span class="text-sm text-[var(--q-fg-3)]">vs</span>
          }
        </div>

        <div class="flex items-center gap-2 flex-1 justify-end">
          <span class="text-sm font-semibold text-[var(--q-fg)] truncate text-right">{{ match().awayTeam.name }}</span>
          @if (match().awayTeam.flagUrl) {
            <img [src]="match().awayTeam.flagUrl" [alt]="match().awayTeam.name" class="w-7 h-5 object-cover rounded-sm" />
          } @else {
            <span class="w-7 h-5 bg-[var(--q-surface-2)] rounded-sm flex items-center justify-center text-[9px] font-bold">
              {{ match().awayTeam.shortName }}
            </span>
          }
        </div>
      </div>

      <div class="mt-2 text-xs text-[var(--q-fg-3)] text-center">
        {{ match().scheduledAt | date:'dd MMM · HH:mm' }}
      </div>
    </div>
  `,
})
export class MatchRowComponent {
  match        = input.required<Match>();
  deadlineDate = input<Date | null>(null);
  rowClick     = output<Match>();
  rowExpired   = output<void>();

  stageLabel() { return STAGE_LABEL[this.match().stage] || this.match().stage; }
}
