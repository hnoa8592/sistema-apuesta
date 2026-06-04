import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PredictionService } from '../../../core/services/prediction.service';
import { GroupService } from '../../../core/services/group.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Match, Prediction } from '../../../core/models';
import { PillComponent } from '../../../shared/components/pill/pill.component';
import { CountdownComponent } from '../../../shared/components/countdown/countdown.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-upcoming-matches',
  standalone: true,
  imports: [CommonModule, PillComponent, CountdownComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="p-4 space-y-4">
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) { <app-skeleton height="80px" /> }
        </div>
      } @else if (items().length === 0) {
        <app-empty-state
          icon="📅"
          title="Sin partidos disponibles"
          description="No hay partidos próximos para este torneo. Los partidos se cargan automáticamente."
        />
      } @else {
        <p class="text-xs text-[var(--q-fg-3)] mb-3">
          {{ items().length }} partido{{ items().length !== 1 ? 's' : '' }} pendiente{{ items().length !== 1 ? 's' : '' }}
        </p>
        <div class="space-y-3">
          @for (item of items(); track item.match.id) {
            <div
              (click)="goToPredict(item)"
              class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 cursor-pointer hover:bg-[var(--q-surface-2)] border border-[var(--q-surface-2)] hover:border-[var(--q-accent)] transition-all"
            >
              <!-- Header row -->
              <div class="flex items-center justify-between mb-3">
                <app-pill [label]="stageLabel(item.match)" variant="default" />
                <div class="flex items-center gap-2">
                  @if (item.isLocked) {
                    <app-pill label="Cerrado" variant="default" />
                  } @else {
                    <app-countdown [targetDate]="item.deadline" size="sm" />
                  }
                </div>
              </div>

              <!-- Teams and score -->
              <div class="flex items-center justify-between gap-3 mb-2">
                <span class="text-sm font-semibold text-[var(--q-fg)] text-center flex-1">
                  {{ item.match.homeTeam.name }}
                </span>

                @if (item.match.status === 'FINISHED') {
                  <div class="text-center px-3">
                    <span class="font-mono font-bold text-lg text-[var(--q-fg)]">
                      {{ item.match.homeScore }} – {{ item.match.awayScore }}
                    </span>
                  </div>
                } @else if (item.prediction) {
                  <div class="text-center px-3">
                    <span class="font-mono font-bold text-lg text-[var(--q-accent)]">
                      {{ item.prediction.homeScorePred }} – {{ item.prediction.awayScorePred }}
                    </span>
                    <p class="text-xs text-[var(--q-fg-3)]">pronóstico</p>
                  </div>
                } @else {
                  <div class="text-center px-3">
                    <span class="font-mono font-bold text-lg text-[var(--q-fg-3)]">–:–</span>
                  </div>
                }

                <span class="text-sm font-semibold text-[var(--q-fg)] text-center flex-1 text-right">
                  {{ item.match.awayTeam.name }}
                </span>
              </div>

              <!-- Match info + action -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-[var(--q-fg-3)]">
                  📅 {{ item.match.scheduledAt | date:'EEE dd MMM · HH:mm' }}
                </span>
                @if (!item.isLocked && !item.prediction) {
                  <span class="text-xs font-semibold text-[var(--q-accent)]">
                    Pronosticar →
                  </span>
                } @else if (!item.isLocked && item.prediction) {
                  <span class="text-xs font-semibold text-[var(--q-accent)]">
                    Editar →
                  </span>
                } @else if (item.isLocked && !item.prediction) {
                  <span class="text-xs text-[var(--q-fg-3)]">
                    No disponible
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class UpcomingMatchesComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private groupSvc = inject(GroupService);
  private tournSvc = inject(TournamentService);
  private predSvc  = inject(PredictionService);
  router = inject(Router);

  loading = signal(true);
  items   = signal<{ match: Match; prediction?: Prediction; deadline: Date; isLocked: boolean }[]>([]);

  ngOnInit() {
    const groupId = this.route.parent?.snapshot.paramMap.get('id')!;
    this.groupSvc.getGroupById(groupId).subscribe({
      next: group => {
        this.tournSvc.getTournamentMatches(group.tournament.id).subscribe({
          next: matches => {
            this.predSvc.getMyPredictions(groupId).subscribe({
              next: preds => {
                const predMap = new Map(preds.map(p => [p.matchId, p]));
                const now = Date.now();
                this.items.set(
                  matches
                    .filter(m => m.status === 'SCHEDULED')
                    .map(m => {
                      const deadline = new Date(new Date(m.scheduledAt).getTime() - group.predictionDeadlineMinutes * 60_000);
                      const isLocked = now >= deadline.getTime();
                      return {
                        match: m,
                        prediction: predMap.get(m.id),
                        deadline,
                        isLocked,
                      };
                    })
                    .sort((a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime())
                );
                this.loading.set(false);
              },
              error: () => this.loading.set(false),
            });
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  stageLabel(m: Match): string {
    const stageLabels: Record<string, string> = {
      GROUP: 'Fase de Grupos',
      ROUND_OF_16: 'Octavos',
      QUARTER_FINAL: 'Cuartos',
      SEMI_FINAL: 'Semifinal',
      THIRD_PLACE: '3er Lugar',
      FINAL: 'Final',
    };
    const stage = stageLabels[m.stage] || m.stage;
    return m.matchDay ? `${stage} · J${m.matchDay}` : stage;
  }

  goToPredict(item: { match: Match; isLocked: boolean }) {
    const groupId = this.route.parent?.snapshot.paramMap.get('id')!;
    if (!item.isLocked) {
      this.router.navigate(['/grupos', groupId, 'pronosticar', item.match.id]);
    }
  }
}