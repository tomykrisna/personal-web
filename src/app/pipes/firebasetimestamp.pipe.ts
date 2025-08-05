import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firebaseTimestamp'
})
export class FirebaseTimestampPipe implements PipeTransform {
  transform(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (value.seconds !== undefined) {
      return new Date(value.seconds * 1000);
    }

    return null;
  }
}
