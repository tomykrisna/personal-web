import {Observable} from 'rxjs';
import {collection, collectionData, Firestore} from '@angular/fire/firestore';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {
  }

  getProjects(id: string): Observable<any[]> {
    const projectRef = collection(this.firestore, 'portfolio');
    return collectionData(projectRef, {idField: id});
  }
}
