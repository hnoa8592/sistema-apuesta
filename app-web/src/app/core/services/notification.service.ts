import { Injectable, signal } from '@angular/core';
import { Toast } from '../models';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<Toast[]>([]);

  private push(toast: Omit<Toast, 'id'>): void {
    const id = generateId();
    this.toasts.update(list => [...list, { ...toast, id }]);
    setTimeout(() => this.remove(id), toast.duration ?? 4000);
  }

  success(message: string): void {
    this.push({ message, type: 'success' });
  }

  error(message: string): void {
    this.push({ message, type: 'error', duration: 5000 });
  }

  info(message: string): void {
    this.push({ message, type: 'info' });
  }

  warning(message: string): void {
    this.push({ message, type: 'warning' });
  }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
