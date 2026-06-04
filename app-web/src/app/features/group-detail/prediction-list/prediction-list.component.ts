import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PredictionService } from '../../../core/services/prediction.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { GroupService } from '../../../core/services/group.service';
import { Match, Prediction, STAGE_LABEL } from '../../../core/models';
import { PillComponent } from '../../../shared/components/pill/pill.component';
import { CountdownComponent } from '../../../shared/components/countdown/countdown.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

interface MatchWithPrediction {
  match: Match;
  prediction?: Prediction;
  deadline: Date;
  isPending: boolean;
  isLocked: boolean;
}

@Component({
  selector: 'app-prediction-list',
  standalone: true,
  imports: [CommonModule, PillComponent, CountdownComponent, SkeletonComponent],
  template: `
    <div class="p-4 space-y-6">
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) { <app-skeleton height="80px" /> }
        </div>
      } @else {
        <!-- Pending -->
        @if (pending().length > 0) {
          <section>
            <h3 class="text-xs font-semibold text-[var(--q-fg-3)] uppercase tracking-wide mb-3">
              Pendientes ({{ pending().length }})
            </h3>
            <div class="space-y-2">
              @for (item of pending(); track item.match.id) {
                <div (click)="navigate(item)"
                     class="bg-[var(--q-surface)] border-l-4 border-[var(--q-danger)] rounded-[var(--radius-md)] p-4 cursor-pointer hover:bg-[var(--q-surface-2)]">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-[var(--q-fg-3)]">{{ stageLabel(item.match) }}</span>
                    <app-countdown [targetDate]="item.deadline" size="sm" />
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-semibold text-[var(--q-fg)]">{{ item.match.homeTeam.name }}</span>
                    <span class="text-xs text-[var(--q-fg-3)] font-mono">–:–</span>
                    <span class="text-sm font-semibold text-[var(--q-fg)] text-right">{{ item.match.awayTeam.name }}</span>
                  </div>
                  <p class="text-xs text-[var(--q-fg-3)] mt-1 text-center">
                    {{ item.match.scheduledAt | date:'EEE dd MMM · HH:mm' }}
                  </p>
                </div>
              }
            </div>
          </section>
        }

        <!-- Sent -->
        @if (sent().length > 0) {
          <section>
            <h3 class="text-xs font-semibold text-[var(--q-fg-3)] uppercase tracking-wide mb-3">
              Enviados ({{ sent().length }})
            </h3>
            <div class="space-y-2">
              @for (item of sent(); track item.match.id) {
                <div (click)="navigate(item)"
                     class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4 cursor-pointer hover:bg-[var(--q-surface-2)]">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-[var(--q-fg-3)]">{{ stageLabel(item.match) }}</span>
                    @if (item.match.status === 'FINISHED') {
                      @if (item.prediction?.pointsEarned !== null && item.prediction?.pointsEarned !== undefined) {
                        <app-pill [label]="'+' + item.prediction!.pointsEarned + ' pts'" variant="success" />
                      }
                    } @else if (!item.isLocked) {
                      <app-pill label="✓ Enviado" variant="success" />
                    } @else {
                      <app-pill label="🔒 Cerrado" variant="default" />
                    }
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-semibold text-[var(--q-fg)]">{{ item.match.homeTeam.name }}</span>
                    <div class="text-center">
                      @if (item.match.status === 'FINISHED') {
                        <span class="font-mono font-bold text-[var(--q-fg)]">
                          {{ item.match.homeScore }} – {{ item.match.awayScore }}
                        </span>
                        <p class="text-xs text-[var(--q-fg-3)]">
                          tú: {{ item.prediction?.homeScorePred }}–{{ item.prediction?.awayScorePred }}
                        </p>
                      } @else {
                        <span class="font-mono font-bold text-[var(--q-accent)]">
                          {{ item.prediction?.homeScorePred }} – {{ item.prediction?.awayScorePred }}
                        </span>
                      }
                    </div>
                    <span class="text-sm font-semibold text-[var(--q-fg)] text-right">{{ item.match.awayTeam.name }}</span>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class PredictionListComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private predSvc     = inject(PredictionService);
  private groupSvc    = inject(GroupService);
  private tournSvc    = inject(TournamentService);
  router = inject(Router);

  loading = signal(true);
  items   = signal<MatchWithPrediction[]>([]);

  pending = computed(() => this.items().filter(i => i.isPending));
  sent    = computed(() => this.items().filter(i => !i.isPending));

  ngOnInit() {
    const groupId = this.route.parent?.snapshot.paramMap.get('id')!;
    this.groupSvc.getGroupById(groupId).subscribe(group => {
      this.tournSvc.getTournamentMatches(group.tournament.id).subscribe(matches => {
        this.predSvc.getMyPredictions(groupId).subscribe(preds => {
          const predMap = new Map(preds.map(p => [p.matchId, p]));
          const now = Date.now();
          this.items.set(matches.map(m => {
            const deadline = new Date(new Date(m.scheduledAt).getTime() - group.predictionDeadlineMinutes * 60_000);
            const isLocked = now >= deadline.getTime() || m.status === 'IN_PROGRESS' || m.status === 'FINISHED';
            const pred = predMap.get(m.id);
            return { match: m, prediction: pred, deadline, isLocked, isPending: !pred && !isLocked };
          }));
          this.loading.set(false);
        });
      });
    });
  }

  navigate(item: MatchWithPrediction) {
    const groupId = this.route.parent?.snapshot.paramMap.get('id')!;
    if (!item.isLocked) {
      this.router.navigate(['/grupos', groupId, 'pronosticar', item.match.id]);
    }
  }

  stageLabel(m: Match) { return `${STAGE_LABEL[m.stage]} · J${m.matchDay}`; }
}
