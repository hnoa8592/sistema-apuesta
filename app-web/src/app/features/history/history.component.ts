import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService } from '../../core/services/prediction.service';
import { UserService } from '../../core/services/user.service';
import { UserStats } from '../../core/models';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface PastPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeScorePred: number;
  awayScorePred: number;
  pointsEarned: number;
  stage: string;
  scheduledAt: string;
  tournamentName: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, PillComponent, EmptyStateComponent],
  template: `
    <div class="p-4 md:p-6 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-2xl font-bold font-display text-[var(--q-fg)]">Mi historial</h1>
        <button class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">🔍</button>
      </div>

      <!-- Summary strip -->
      @if (stats()) {
        <div class="grid grid-cols-4 gap-2 mb-6">
          <app-stat-card label="Jugados"  [value]="stats()!.predictionsTotal" />
          <app-stat-card label="Aciertos" [value]="stats()!.predictionsCorrect" />
          <app-stat-card label="Exactos"  [value]="stats()!.predictionsExact" />
          <app-stat-card label="Total pts" [value]="stats()!.totalPoints" />
        </div>
      }

      @if (predictions().length === 0) {
        <app-empty-state icon="📋" title="Sin historial"
                         description="Tus pronósticos finalizados aparecerán aquí." />
      } @else {
        <div class="space-y-2">
          @for (p of predictions(); track p.matchId) {
            <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-[var(--q-fg-3)]">{{ p.stage }} · {{ p.tournamentName }}</span>
                @if (p.pointsEarned === p.homeScore + p.awayScore) {
                  <app-pill [label]="'✓ Exacto +' + p.pointsEarned" variant="accent" />
                } @else if (p.pointsEarned > 0) {
                  <app-pill [label]="'✓ Resultado +' + p.pointsEarned" variant="success" />
                } @else {
                  <app-pill label="✗ Falló 0" variant="danger" />
                }
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-[var(--q-fg)] flex-1">{{ p.homeTeam }}</span>
                <div class="text-center">
                  <span class="font-mono font-bold text-[var(--q-fg)]">{{ p.homeScore }} – {{ p.awayScore }}</span>
                  <p class="text-xs text-[var(--q-fg-3)]">tú: {{ p.homeScorePred }}–{{ p.awayScorePred }}</p>
                </div>
                <span class="text-sm font-semibold text-[var(--q-fg)] flex-1 text-right">{{ p.awayTeam }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  private userSvc = inject(UserService);
  stats       = signal<UserStats | null>(null);
  predictions = signal<PastPrediction[]>([]);

  ngOnInit() {
    this.userSvc.getStats().subscribe(s => this.stats.set(s));
  }
}
