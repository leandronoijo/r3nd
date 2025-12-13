import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

export interface Fact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

interface GreetingResponse {
  greeting: string;
  fact: Fact;
}

type RuntimeWindow = typeof globalThis & {
  __API_BASE_URL__?: string | undefined;
};

@Injectable({
  providedIn: 'root'
})
export class GreetingService {
  private greetingSubject = new BehaviorSubject<string | null>(null);
  private factSubject = new BehaviorSubject<Fact | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public readonly greeting$: Observable<string | null> = this.greetingSubject.asObservable();
  public readonly fact$: Observable<Fact | null> = this.factSubject.asObservable();
  public readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  fetchGreeting(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http
      .get<GreetingResponse>(`${this.baseUrl}/greetings`, { observe: 'response' })
      .pipe(
        map((response) => {
          this.ensureJsonContent(response);
          const payload = response.body;

          if (!payload) {
            throw new Error('Greeting payload was empty.');
          }

          return payload;
        }),
        tap(({ greeting, fact }) => {
          this.greetingSubject.next(greeting ?? null);
          this.factSubject.next(fact ?? null);
        }),
        catchError((error) => {
          this.handleError(error);
          return of(null);
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe();
  }

  private get baseUrl(): string {
    const runtimeWindow = globalThis as RuntimeWindow;
    const runtimeValue = runtimeWindow.__API_BASE_URL__ || undefined;
    const candidate = runtimeValue ?? '/api';
    const normalized = candidate.replace(/\/+$/, '');
    return normalized || '/api';
  }

  private ensureJsonContent(response: HttpResponse<GreetingResponse>): void {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API responded with an unsupported content type.');
    }
  }

  private handleError(error: unknown): void {
    this.greetingSubject.next(null);
    this.factSubject.next(null);
    this.errorSubject.next(this.resolveMessage(error));
  }

  private resolveMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payloadMessage = this.extractMessage(error.error);
      return (
        payloadMessage ||
        `Failed to load greeting (status ${error.status || 'unknown'}).`
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred while fetching the greeting.';
  }

  private extractMessage(payload: unknown): string | null {
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    return null;
  }
}
