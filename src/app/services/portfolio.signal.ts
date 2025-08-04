import {computed, Injectable, signal} from "@angular/core";
import {Subject, takeUntil} from "rxjs";
import {FirebaseService} from './firebase.service';
import {ResponsePortfolioDto} from './portfolio.dto';

const InitialState = {
  data$: {} as ResponsePortfolioDto,
  loaded$: false,
  loading$: false,
  error$: null,
}

@Injectable({
  providedIn: 'root'
})

export class PortfolioSignalService {
  private terminate$ = new Subject<void>();
  state = signal(InitialState);
  data$ = computed(() => this.state().data$);
  loaded$ = computed(() => this.state().loaded$);
  loading$ = computed(() => this.state().loading$);
  error$ = computed(() => this.state().error$);

  constructor(private firebaseService: FirebaseService) {

  }

  public getPortfolio() {
    return new Promise((resolve, reject) => {
      this.state.set({
        data$: {} as ResponsePortfolioDto,
        loaded$: false,
        loading$: true,
        error$: null,
      })

      this.firebaseService.getProjects('3NGx21lNUmjVwy3DeRgW')
        .pipe(takeUntil(this.terminate$))
        .subscribe({
          next: (data) => {
            this.state.set({
              data$: data[0],
              loaded$: true,
              loading$: false,
              error$: null,
            })
            resolve(true)
          }, error: (error) => {
            this.state.set({
              data$: {} as ResponsePortfolioDto,
              loaded$: true,
              loading$: false,
              error$: error,
            })
            reject(error)
          }
        })
    })
  }

  destroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }
}
