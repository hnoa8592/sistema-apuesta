import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { GroupMember } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { PillComponent } from '../../../shared/components/pill/pill.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, AvatarComponent, PillComponent],
  template: `
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-[var(--q-fg-2)]">{{ members().length }} inscritos</span>
        <button (click)="copyInvite()"
                [disabled]="!inviteUrl()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--q-accent)] text-[var(--q-fg)] text-xs font-semibold disabled:opacity-50">
          🔗 Copiar enlace
        </button>
      </div>

      @if (inviteUrl()) {
        <div class="mb-3 px-3 py-2 bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] text-xs text-[var(--q-fg-3)] break-all">
          📋 {{ inviteUrl() }}
        </div>
      }

      <div class="space-y-2">
        @for (member of members(); track member.id) {
          <div class="flex items-center gap-3 p-3 bg-[var(--q-surface)] rounded-[var(--radius-md)]">
            <app-avatar [name]="member.name" [pictureUrl]="member.pictureUrl" size="sm" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-semibold text-[var(--q-fg)] truncate">{{ member.name }}</span>
                @if (member.role === 'ORGANIZER') { <app-pill label="Organizador" variant="organizer" /> }
                @if (member.hasPaid) { <app-pill label="Pagó" variant="success" /> }
              </div>
              <span class="text-xs text-[var(--q-fg-3)]">
                {{ member.email }} · Inscrito {{ member.joinedAt | date:'dd/MM' }}
              </span>
            </div>
            <span class="text-sm font-bold font-display text-[var(--q-fg)]">{{ member.totalPoints }} pts</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class ParticipantsComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private groupSvc = inject(GroupService);
  private notify   = inject(NotificationService);

  members   = signal<GroupMember[]>([]);
  inviteUrl = signal<string>('');

  ngOnInit() {
    const id = this.route.parent?.snapshot.paramMap.get('id')!;
    this.groupSvc.getMembers(id).subscribe(m => this.members.set(m));
    this.groupSvc.getInviteCode(id).subscribe({
      next: invite => this.inviteUrl.set(invite.inviteUrl),
      error: () => this.inviteUrl.set(''),
    });
  }

  copyInvite() {
    const url = this.inviteUrl();
    if (!url) {
      this.notify.error('Cargando enlace… intenta de nuevo');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      this.notify.success('Enlace de invitación copiado');
    }).catch(() => {
      this.notify.error('No se pudo copiar');
    });
  }
}
