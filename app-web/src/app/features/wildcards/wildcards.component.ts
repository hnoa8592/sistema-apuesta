import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WildcardService, WildcardsRequest } from '../../core/services/wildcard.service';
import { GroupService } from '../../core/services/group.service';
import { TournamentService } from '../../core/services/tournament.service';
import { NotificationService } from '../../core/services/notification.service';
import { Wildcard, WildcardType, Team, BettingGroup, WILDCARD_LABEL } from '../../core/models';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-wildcards',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressBarComponent],
  template: `
    <div class="p-4 md:p-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button (click)="router.navigate(['..'], { relativeTo: route })"
                class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">←</button>
        <div>
          <h1 class="text-xl font-bold font-display text-[var(--q-fg)]">Comodines</h1>
          <p class="text-xs text-[var(--q-fg-3)]">{{ group()?.tournament?.name }}</p>
        </div>
      </div>

      <p class="text-sm text-[var(--q-fg-2)] mb-5">
        5 elecciones que se cierran al iniciar la fase de grupos. Cada acierto suma <strong>+5 pts</strong>.
      </p>

      <!-- Progress card -->
      <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-[var(--q-fg)]">{{ filledCount() }} de 5 elegidos</span>
          <span class="text-sm font-bold text-[var(--q-accent)]">{{ filledCount() * 5 }} / 25 pts pot.</span>
        </div>
        <app-progress-bar [value]="filledCount()" [max]="5" height="8px" />
        @if (!isLocked()) {
          <p class="text-xs text-[var(--q-danger)] mt-2 font-medium">
            ⏰ Cierra al iniciar el torneo
          </p>
        }
      </div>

      <!-- Wildcard rows -->
      <div class="space-y-3">
        @for (wc of wildcards(); track wc.type) {
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-4 border"
               [class.border-[var(--q-surface-2)]]="!wc.isLocked"
               [class.border-[var(--q-fg-3)]/30]="wc.isLocked">
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ wc.isLocked ? '🔒' : '⭐' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-[var(--q-fg-3)] font-semibold">+5 PTS</p>
                <p class="text-sm font-semibold text-[var(--q-fg)]">{{ wildcardLabel(wc.type) }}</p>
              </div>
            </div>

            @if (!wc.isLocked) {
              <!-- Team selector for finalists -->
              @if (wc.type === 'FINALIST_1' || wc.type === 'FINALIST_2') {
                @if (teams().length > 0) {
                  <select [(ngModel)]="wc.teamId"
                          class="mt-3 w-full px-3 py-2 bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] text-sm text-[var(--q-fg)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
                    <option value="">Seleccionar equipo…</option>
                    @for (t of teams(); track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                } @else {
                  <p class="mt-3 text-xs text-[var(--q-fg-3)] italic">Sincroniza los partidos del torneo para ver equipos</p>
                }
              } @else {
                <!-- Text input for players -->
                <input [(ngModel)]="wc.playerName" type="text"
                       [placeholder]="'Nombre del ' + wildcardLabel(wc.type).toLowerCase()"
                       class="mt-3 w-full px-3 py-2 bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
              }
            } @else {
              <!-- Show locked value -->
              <p class="mt-2 text-sm text-[var(--q-fg-2)]">
                {{ wc.teamName || wc.playerName || 'Sin elegir' }}
                @if (wc.pointsEarned !== null && wc.pointsEarned !== undefined) {
                  <span [class.text-[var(--q-accent)]]="wc.pointsEarned > 0"
                        [class.text-[var(--q-fg-3)]]="wc.pointsEarned === 0"
                        class="ml-2 font-bold">
                    {{ wc.pointsEarned > 0 ? '+' + wc.pointsEarned + ' pts' : '0 pts' }}
                  </span>
                }
              </p>
            }
          </div>
        }
      </div>

      @if (!isLocked()) {
        <button (click)="save()" [disabled]="saving()"
                class="mt-6 w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold disabled:opacity-50">
          {{ saving() ? 'Guardando…' : 'Confirmar selecciones' }}
        </button>
      }
    </div>
  `,
})
export class WildcardsComponent implements OnInit {
  route    = inject(ActivatedRoute);
  router   = inject(Router);
  private wcSvc    = inject(WildcardService);
  private grpSvc   = inject(GroupService);
  private tournSvc = inject(TournamentService);
  private notify   = inject(NotificationService);

  group    = signal<BettingGroup | null>(null);
  wildcards = signal<Wildcard[]>([]);
  teams    = signal<Team[]>([]);
  saving   = signal(false);
  isLocked = signal(false);

  filledCount = () => this.wildcards().filter(w => w.teamId || w.playerName).length;

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.grpSvc.getGroupById(groupId).subscribe(g => {
      this.group.set(g);
      this.isLocked.set(g.tournament.status !== 'SCHEDULED');
      // Load teams for FINALIST wildcards
      this.tournSvc.getTournamentTeams(g.tournament.id).subscribe(teams => {
        this.teams.set(teams);
      });
    });

    this.wcSvc.getWildcards(groupId).subscribe(wcs => {
      const types: WildcardType[] = ['FINALIST_1','FINALIST_2','BEST_PLAYER','BEST_GOALKEEPER','TOP_SCORER'];
      const map = new Map(wcs.map(w => [w.type, w]));
      this.wildcards.set(types.map(t => map.get(t) || {
        groupId, type: t, isLocked: this.isLocked(),
      }));
    });
  }

  wildcardLabel(type: WildcardType) { return WILDCARD_LABEL[type]; }

  save() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.saving.set(true);
    const req: WildcardsRequest = {
      wildcards: this.wildcards().map(w => ({
        type: w.type,
        teamId: w.teamId,
        playerName: w.playerName,
      })),
    };
    this.wcSvc.updateWildcards(groupId, req).subscribe({
      next: wcs => {
        this.wildcards.set(wcs);
        this.notify.success('¡Comodines guardados!');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
