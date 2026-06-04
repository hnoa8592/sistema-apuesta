import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PredictionService, PredictionRequest } from '../../core/services/prediction.service';
import { TournamentService } from '../../core/services/tournament.service';
import { GroupService } from '../../core/services/group.service';
import { NotificationService } from '../../core/services/notification.service';
import { Match, Prediction, BettingGroup, STAGE_POINTS, STAGE_LABEL } from '../../core/models';
import { TeamStepperComponent } from '../../shared/components/team-stepper/team-stepper.component';
import { CountdownComponent } from '../../shared/components/countdown/countdown.component';
import { PillComponent } from '../../shared/components/pill/pill.component';

type PredictState = 'EDITABLE' | 'SENT' | 'LOCKED' | 'LOADING' | 'RESULT';

const DRAFT_KEY = (gId: string, mId: string) => `draft_${gId}_${mId}`;
const PRESETS = [[1,0],[2,0],[2,1],[1,1],[0,0],[0,1],[1,2],[3,1],[3,0]];

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [CommonModule, TeamStepperComponent, CountdownComponent, PillComponent],
  template: `
    <div class="p-4 md:p-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <button (click)="goBack()"
                class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">←</button>
        <h1 class="text-lg font-semibold text-[var(--q-fg)]">Pronóstico</h1>
        <div class="w-9"></div>
      </div>

      @if (match()) {
        <!-- Countdown -->
        <div class="text-center mb-6">
          <p class="text-xs text-[var(--q-fg-3)] uppercase tracking-wide mb-1">Cierra en</p>
          <app-countdown [targetDate]="deadline()!" size="lg" (expired)="onExpired()" />
          <p class="text-xs text-[var(--q-fg-3)] mt-1">
            {{ group()?.predictionDeadlineMinutes }} min antes del inicio ·
            {{ match()!.scheduledAt | date:'HH:mm' }}
          </p>
        </div>

        <!-- Match card -->
        <div class="bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-5 mb-4">
          <div class="flex items-center gap-2 justify-center mb-4">
            <app-pill [label]="stageLabel()" variant="default" />
            <app-pill [label]="'+' + stagePoints().exactScore + ' pts si exacto'" variant="accent" />
          </div>

          <!-- Team steppers -->
          <div class="grid grid-cols-2 gap-6">
            <app-team-stepper
              [teamName]="match()!.homeTeam.name"
              [teamCode]="match()!.homeTeam.shortName || '???'"
              [flagUrl]="match()!.homeTeam.flagUrl"
              [disabled]="isLocked()"
              [(value)]="homeScore"
            />
            <app-team-stepper
              [teamName]="match()!.awayTeam.name"
              [teamCode]="match()!.awayTeam.shortName || '???'"
              [flagUrl]="match()!.awayTeam.flagUrl"
              [disabled]="isLocked()"
              [(value)]="awayScore"
            />
          </div>

          <!-- Score display -->
          <div class="text-center mt-5">
            <span class="text-5xl font-bold font-display text-[var(--q-fg)] tabular-nums">
              {{ homeScore() }} – {{ awayScore() }}
            </span>
            <p class="text-sm text-[var(--q-fg-2)] mt-2">{{ resultText() }}</p>
          </div>
        </div>

        <!-- Presets -->
        @if (!isLocked()) {
          <div class="overflow-x-auto pb-2 mb-4">
            <div class="flex gap-2">
              @for (p of presets; track p[0] + '-' + p[1]) {
                <button (click)="setPreset(p[0], p[1])"
                        [class]="presetClass(p[0], p[1])">
                  {{ p[0] }}-{{ p[1] }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Rules card -->
        <div class="bg-[var(--q-surface-2)] rounded-[var(--radius-md)] p-3 mb-6 flex gap-2">
          <span>⭐</span>
          <p class="text-xs text-[var(--q-fg-2)]">
            {{ stagePoints().correctResult }} pt si aciertas resultado ·
            {{ stagePoints().exactScore }} pts si aciertas marcador exacto.
            En penales solo cuenta el score final del tiempo reglamentario.
          </p>
        </div>

        <!-- State: LOCKED -->
        @if (state() === 'LOCKED') {
          <div class="bg-[var(--q-danger)]/10 rounded-[var(--radius-md)] p-4 text-center">
            <p class="text-sm font-semibold text-[var(--q-danger)]">🔒 Tiempo expirado</p>
            <p class="text-xs text-[var(--q-fg-3)] mt-1">Ya no puedes modificar este pronóstico.</p>
          </div>
        }

        <!-- State: RESULT -->
        @if (state() === 'RESULT') {
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4 text-center border border-[var(--q-surface-2)]">
            <p class="text-sm text-[var(--q-fg-2)]">Resultado</p>
            <p class="text-3xl font-bold font-display text-[var(--q-fg)]">
              {{ match()!.homeScore }} – {{ match()!.awayScore }}
            </p>
            @if (existingPrediction()?.pointsEarned !== null) {
              <p class="text-lg font-semibold text-[var(--q-accent)] mt-2">
                +{{ existingPrediction()?.pointsEarned ?? 0 }} pts
              </p>
            }
          </div>
        }

        <!-- Action buttons -->
        @if (state() === 'EDITABLE' || state() === 'SENT') {
          <div class="flex gap-3">
            <button (click)="saveDraft()"
                    class="flex-1 py-3 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] text-sm font-medium text-[var(--q-fg)] hover:bg-[var(--q-surface-2)] transition-colors">
              Guardar borrador
            </button>
            <button (click)="submit()" [disabled]="state() === 'LOADING'"
                    class="flex-1 py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              @if (state() === 'LOADING') {
                <span class="inline-block w-4 h-4 border-2 border-[var(--q-fg)] border-t-transparent rounded-full animate-spin"></span>
              } @else {
                {{ existingPrediction() ? 'Actualizar pronóstico' : 'Enviar pronóstico' }}
              }
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class PredictComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private predSvc = inject(PredictionService);
  private grpSvc  = inject(GroupService);
  private tournSvc = inject(TournamentService);
  private notify  = inject(NotificationService);

  match              = signal<Match | null>(null);
  group              = signal<BettingGroup | null>(null);
  existingPrediction = signal<Prediction | null>(null);
  state              = signal<PredictState>('EDITABLE');
  homeScore          = signal(0);
  awayScore          = signal(0);
  deadline           = signal<Date | null>(null);

  presets = PRESETS;

  isLocked = computed(() => ['LOCKED', 'RESULT'].includes(this.state()));

  resultText = computed(() => {
    const h = this.homeScore(), a = this.awayScore();
    if (h > a) return `Gana ${this.match()?.homeTeam.name} por ${h - a}`;
    if (a > h) return `Gana ${this.match()?.awayTeam.name} por ${a - h}`;
    return 'Empate';
  });

  stageLabel   = computed(() => STAGE_LABEL[this.match()?.stage ?? 'GROUP']);
  stagePoints  = computed(() => STAGE_POINTS[this.match()?.stage ?? 'GROUP']);

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    const matchId = this.route.snapshot.paramMap.get('matchId')!;

    this.grpSvc.getGroupById(groupId).subscribe(g => {
      this.group.set(g);
      this.tournSvc.getTournamentMatches(g.tournament.id).subscribe(matches => {
        const m = matches.find(x => x.id === matchId);
        if (!m) return;
        this.match.set(m);
        const dl = new Date(new Date(m.scheduledAt).getTime() - g.predictionDeadlineMinutes * 60_000);
        this.deadline.set(dl);

        if (m.status === 'FINISHED') { this.state.set('RESULT'); }
        else if (Date.now() >= dl.getTime()) { this.state.set('LOCKED'); }

        this.predSvc.getMyPredictions(groupId).subscribe(preds => {
          const pred = preds.find(p => p.matchId === matchId);
          if (pred) {
            this.existingPrediction.set(pred);
            this.homeScore.set(pred.homeScorePred);
            this.awayScore.set(pred.awayScorePred);
            if (this.state() === 'EDITABLE') this.state.set('SENT');
          } else {
            const draft = localStorage.getItem(DRAFT_KEY(groupId, matchId));
            if (draft) {
              const d = JSON.parse(draft);
              this.homeScore.set(d.home); this.awayScore.set(d.away);
            }
          }
        });
      });
    });
  }

  setPreset(h: number, a: number) { this.homeScore.set(h); this.awayScore.set(a); }

  presetClass(h: number, a: number) {
    const base = 'shrink-0 px-3 py-1.5 rounded-full text-sm font-mono font-bold border-2 transition-colors';
    const isActive = this.homeScore() === h && this.awayScore() === a;
    return isActive
      ? `${base} bg-[var(--q-fg)] text-[var(--q-bg)] border-[var(--q-fg)]`
      : `${base} bg-transparent text-[var(--q-fg-2)] border-[var(--q-surface-2)] hover:border-[var(--q-fg-2)]`;
  }

  saveDraft() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    const matchId = this.route.snapshot.paramMap.get('matchId')!;
    localStorage.setItem(DRAFT_KEY(groupId, matchId), JSON.stringify({ home: this.homeScore(), away: this.awayScore() }));
    this.notify.info('Borrador guardado localmente');
  }

  submit() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    const matchId = this.route.snapshot.paramMap.get('matchId')!;
    this.state.set('LOADING');
    const req: PredictionRequest = { matchId, homeScore: this.homeScore(), awayScore: this.awayScore() };
    this.predSvc.submitPrediction(groupId, req).subscribe({
      next: pred => {
        this.existingPrediction.set(pred);
        localStorage.removeItem(DRAFT_KEY(groupId, matchId));
        this.notify.success('¡Pronóstico enviado!');
        this.state.set('SENT');
      },
      error: () => this.state.set('EDITABLE'),
    });
  }

  onExpired() { if (this.state() !== 'RESULT') this.state.set('LOCKED'); }
  goBack() { this.router.navigate(['..'], { relativeTo: this.route }); }
}
