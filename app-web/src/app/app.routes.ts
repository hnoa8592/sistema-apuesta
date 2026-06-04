import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { profileCompleteGuard } from './core/auth/profile-complete.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'explorar', pathMatch: 'full' },
      {
        path: 'explorar',
        loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent),
      },
      {
        path: 'mis-grupos',
        loadComponent: () => import('./features/my-groups/my-groups.component').then(m => m.MyGroupsComponent),
      },
      {
        path: 'mis-grupos/crear',
        canActivate: [profileCompleteGuard],
        loadComponent: () => import('./features/my-groups/create-group/create-group.component').then(m => m.CreateGroupComponent),
      },
      {
        path: 'grupos/:id',
        loadComponent: () => import('./features/group-detail/group-detail.component').then(m => m.GroupDetailComponent),
        children: [
          { path: '', redirectTo: 'puntajes', pathMatch: 'full' },
          {
            path: 'puntajes',
            loadComponent: () => import('./features/group-detail/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
          },
          {
            path: 'pronosticos',
            loadComponent: () => import('./features/group-detail/prediction-list/prediction-list.component').then(m => m.PredictionListComponent),
          },
          {
            path: 'participantes',
            loadComponent: () => import('./features/group-detail/participants/participants.component').then(m => m.ParticipantsComponent),
          },
          {
            path: 'proximos',
            loadComponent: () => import('./features/group-detail/upcoming-matches/upcoming-matches.component').then(m => m.UpcomingMatchesComponent),
          },
        ],
      },
      {
        path: 'grupos/:groupId/pronosticar/:matchId',
        loadComponent: () => import('./features/predict/predict.component').then(m => m.PredictComponent),
      },
      {
        path: 'grupos/:groupId/comodines',
        loadComponent: () => import('./features/wildcards/wildcards.component').then(m => m.WildcardsComponent),
      },
      {
        path: 'grupos/:groupId/premiacion',
        loadComponent: () => import('./features/awards/awards.component').then(m => m.AwardsComponent),
      },
      {
        path: 'historial',
        loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'perfil/editar',
        loadComponent: () => import('./features/profile/edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'explorar' },
];
