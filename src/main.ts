import 'zone.js/dist/zone';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  of,
  startWith,
  switchMap,
  debounceTime,
  Observable,
} from 'rxjs';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <select (change)="onChangeName($event)">
      <option value="">select username</option>
      <option value="Bret">Bret</option>
      <option value="Antonette">Antonette</option>
      <option value="Samantha">Samantha</option>
    </select>


    <input id="searchInput" type="text" placeholder="search"/>


    <ul>
      <li *ngFor="let user of filteredUsers$ | async">
        {{user.username}}
      </li>
    </ul>
    
  `,
})
export class App {
  private http = inject(HttpClient);
  name = 'Angular';
  baseUrl = 'https://jsonplaceholder.typicode.com/users';

  selectedUserNameSubject = new BehaviorSubject<string>('');
  selectedUserNameAction$ = this.selectedUserNameSubject.asObservable();

  users$ = this.http.get<any>(this.baseUrl);
  filteredUsers$: Observable<any>;

  ngOnInit() {
    const searchInput = document.querySelector(
      '#searchInput'
    ) as HTMLInputElement;
    const search$ = fromEvent(searchInput, 'input').pipe(
      map((event: Event) => (event.target as HTMLInputElement).value),
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchValue) => {
        if (searchValue) {
          return this.http.get<any>(
            `https://jsonplaceholder.typicode.com/users/${searchValue}`
          );
        } else {
          return of([]); // Empty array if searchValue is empty
        }
      })
    );

    this.filteredUsers$ = combineLatest([
      this.users$,
      this.selectedUserNameAction$,
      search$,
    ]).pipe(
      map(([users, userName, searchResults]) => {
        const filteredUsers = users.filter((user) => {
          const nameMatch = userName ? user.username === userName : true;
          return nameMatch;
        });

        return searchResults.length > 0
          ? users.filter((user) => {
              return searchResults?.username === user.username;
            })
          : filteredUsers;
      })
    );
  }

  onChangeName(event: Event) {
    let selectedUserName = (event.target as HTMLSelectElement).value;
    this.selectedUserNameSubject.next(selectedUserName);
  }
}

bootstrapApplication(App);
