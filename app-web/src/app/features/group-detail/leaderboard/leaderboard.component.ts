import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { Leaderboard } from '../../../core/models';
import { LeaderRowComponent } from '../../../shared/components/leader-row/leader-row.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, LeaderRowComponent, SkeletonComponent],
  template: `
    <div class="p-4">
      @if (loading()) {
        <div class="space-y-2">
          @for (i of [1,2,3,4,5]; track i) {
            <app-skeleton height="56px" />
          }
        </div>
      } @else if (leaderboard()) {
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-[var(--q-fg)]">Tabla general</h2>
          <span class="text-xs text-[var(--q-fg-3)]">
            Actualizado {{ leaderboard()!.updatedAt | date:'HH:mm' }}
          </span>
        </div>
        <div>
          @for (entry of leaderboard()!.entries; track entry.userId) {
            <app-leader-row [entry]="entry" />
          }
        </div>
      }
    </div>
  `,
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private groupSvc = inject(GroupService);

  loading     = signal(true);
  leaderboard = signal<Leaderboard | null>(null);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.load();
    this.timer = setInterval(() => {
      if (!document.hidden) this.load();
    }, 60_000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private load() {
    const id = this.route.parent?.snapshot.paramMap.get('id')!;
    this.groupSvc.getLeaderboard(id).subscribe({
      next: lb => { this.leaderboard.set(lb); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
