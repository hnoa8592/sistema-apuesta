import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyBs', standalone: true })
export class CurrencyBsPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value == null) return '—';
    return `Bs ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
}
