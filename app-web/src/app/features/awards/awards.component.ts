import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { WildcardService } from '../../core/services/wildcard.service';
import { AuthService } from '../../core/auth/auth.service';
import { GroupAwards, Wildcard, WILDCARD_LABEL, WildcardType } from '../../core/models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { CurrencyBsPipe } from '../../shared/pipes/currency-bs.pipe';

@Component({
  selector: 'app-awards',
  standalone: true,
  imports: [CommonModule, AvatarComponent, CurrencyBsPipe],
  template: `
    @if (awards()) {
      <div class="min-h-screen bg-[var(--q-fg)]">
        <!-- Hero -->
        <div class="px-6 pt-12 pb-8 text-center">
          <button (click)="router.navigate(['/mis-grupos'])"
                  class="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-[var(--q-bg)]">
            ←
          </button>
          <p class="text-[var(--q-accent)] text-sm font-semibold uppercase tracking-widest mb-3">
            {{ groupName() }}
          </p>
          <h1 class="font-bold font-display text-[var(--q-bg)] text-3xl mb-2">
            🏆 ¡Se acabó!<br>Felicidades {{ winner()?.name }}
          </h1>
          <p class="text-[var(--q-bg)]/60 text-sm">
            Pozo de {{ awards()!.totalPool | currencyBs }} · {{ awards()!.prizes.length }} jugadores
          </p>
        </div>

        <!-- Podium -->
        <div class="px-6 mb-8">
          <div class="flex items-end justify-center gap-4">
            <!-- 2nd place -->
            @if (awards()!.prizes[1]) {
              <div class="flex-1 text-center">
                <app-avatar [name]="awards()!.prizes[1].name" size="lg" />
                <p class="text-[var(--q-bg)] font-semibold text-sm mt-2 truncate">{{ awards()!.prizes[1].name }}</p>
                <p class="text-[var(--q-bg)]/60 text-xs">{{ awards()!.prizes[1].points }} pts</p>
                <div class="bg-[var(--q-bg)]/20 rounded-t-[var(--radius-md)] mt-2 h-16 flex items-end justify-center pb-2">
                  <span class="text-2xl">🥈</span>
                </div>
              </div>
            }

            <!-- 1st place -->
            @if (awards()!.prizes[0]) {
              <div class="flex-1 text-center">
                <app-avatar [name]="awards()!.prizes[0].name" size="xl" />
                <p class="text-[var(--q-bg)] font-bold mt-2 truncate">{{ awards()!.prizes[0].name }}</p>
                <p class="text-[var(--q-accent)] text-sm font-bold">{{ awards()!.prizes[0].points }} pts</p>
                <div class="bg-[var(--q-accent)]/20 rounded-t-[var(--radius-md)] mt-2 h-24 flex items-end justify-center pb-2">
                  <span class="text-3xl">🥇</span>
                </div>
              </div>
            }

            <!-- 3rd place -->
            @if (awards()!.prizes[2]) {
              <div class="flex-1 text-center">
                <app-avatar [name]="awards()!.prizes[2].name" size="lg" />
                <p class="text-[var(--q-bg)] font-semibold text-sm mt-2 truncate">{{ awards()!.prizes[2].name }}</p>
                <p class="text-[var(--q-bg)]/60 text-xs">{{ awards()!.prizes[2].points }} pts</p>
                <div class="bg-[var(--q-bg)]/20 rounded-t-[var(--radius-md)] mt-2 h-12 flex items-end justify-center pb-2">
                  <span class="text-xl">🥉</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- My result card -->
        @if (myPrize()) {
          <div class="mx-4 mb-6 bg-white/10 rounded-[var(--radius-xl)] p-5">
            <p class="text-[var(--q-bg)]/60 text-sm mb-1">Tu resultado</p>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[var(--q-bg)] text-xl font-bold font-display">{{ myPrize()!.position }}° lugar</p>
                <p class="text-[var(--q-bg)]/60 text-sm">{{ myPrize()!.amount | currencyBs }} premio</p>
              </div>
              <div class="text-right">
                <p class="text-[var(--q-accent)] text-4xl font-bold font-display">{{ myPrize()!.points }}</p>
                <p class="text-[var(--q-bg)]/60 text-xs">puntos</p>
              </div>
            </div>
          </div>
        }

        <!-- Full ranking (collapsible) -->
        <div class="mx-4 mb-6">
          <button (click)="showFull.set(!showFull())"
                  class="w-full text-[var(--q-bg)]/60 text-sm text-center mb-3">
            {{ showFull() ? '▲ Ocultar' : '▼ Ver ranking completo' }}
          </button>
          @if (showFull()) {
            <div class="space-y-2">
              @for (p of awards()!.prizes; track p.userId) {
                <div class="flex items-center gap-3 bg-white/10 rounded-[var(--radius-md)] px-4 py-3">
                  <span class="text-[var(--q-bg)] font-bold w-6">{{ p.position }}</span>
                  <span class="text-[var(--q-bg)] text-sm flex-1 font-medium">{{ p.name }}</span>
                  <span class="text-[var(--q-bg)]/60 text-sm">{{ p.points }} pts</span>
                  <span class="text-[var(--q-accent)] text-sm font-bold">{{ p.amount | currencyBs }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Buttons -->
        <div class="mx-4 pb-8 flex gap-3">
          <button (click)="router.navigate(['/historial'])"
                  class="flex-1 py-3 rounded-[var(--radius-md)] border border-[var(--q-bg)]/30 text-[var(--q-bg)] font-medium text-sm">
            Ver historial
          </button>
          <button (click)="claimDialogOpen.set(true)"
                  class="flex-1 py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">
            Reclamar premio
          </button>
        </div>
      </div>
    }

    <!-- Claim dialog -->
    @if (claimDialogOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="claimDialogOpen.set(false)">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-6 max-w-sm w-full"
             (click)="$event.stopPropagation()">
          <h3 class="font-bold text-[var(--q-fg)] mb-3">Reclamar premio</h3>
          <p class="text-sm text-[var(--q-fg-2)] mb-4">
            Comunícate con el organizador del grupo para coordinar el pago de tu premio.
          </p>
          <button (click)="claimDialogOpen.set(false)"
                  class="w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold">
            Entendido
          </button>
        </div>
      </div>
    }
  `,
})
export class AwardsComponent implements OnInit {
  route    = inject(ActivatedRoute);
  router   = inject(Router);
  private grpSvc  = inject(GroupService);
  private authSvc = inject(AuthService);

  awards          = signal<GroupAwards | null>(null);
  wildcards       = signal<Wildcard[]>([]);
  groupName       = signal('');
  showFull        = signal(false);
  claimDialogOpen = signal(false);

  winner  = () => this.awards()?.prizes[0];
  myPrize = () => this.awards()?.prizes.find(p => p.userId === this.authSvc.user()?.id);

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.grpSvc.getGroupById(groupId).subscribe(g => this.groupName.set(g.name));
    this.grpSvc.getAwards(groupId).subscribe(a => this.awards.set(a));
  }

  wildcardLabel(type: WildcardType) { return WILDCARD_LABEL[type]; }
}
