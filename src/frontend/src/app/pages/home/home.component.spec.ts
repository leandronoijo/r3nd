import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { GreetingCardComponent } from '../../components/greeting-card/greeting-card.component';
import { Fact, GreetingService } from '../../services/greeting.service';
import { HomeComponent } from './home.component';

class MockGreetingService {
  private greetingSubject = new BehaviorSubject<string | null>('stub greeting');
  private factSubject = new BehaviorSubject<Fact | null>({
    text: 'Fact from mock',
    language: 'en',
    source: 'tests',
    permalink: 'https://example.com'
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  greeting$ = this.greetingSubject.asObservable();
  fact$ = this.factSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  fetchGreeting = vi.fn();

  emit(values: {
    greeting?: string | null;
    fact?: Fact | null;
    loading?: boolean;
    error?: string | null;
  }): void {
    if (values.greeting !== undefined) {
      this.greetingSubject.next(values.greeting);
    }
    if (values.fact !== undefined) {
      this.factSubject.next(values.fact);
    }
    if (values.loading !== undefined) {
      this.loadingSubject.next(values.loading);
    }
    if (values.error !== undefined) {
      this.errorSubject.next(values.error);
    }
  }
}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let mockGreetingService: MockGreetingService;

  beforeEach(async () => {
    mockGreetingService = new MockGreetingService();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: GreetingService, useValue: mockGreetingService }]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call fetchGreeting on init', () => {
    expect(mockGreetingService.fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it('should call fetchGreeting when refresh button is clicked', () => {
    const refreshBtn = fixture.debugElement.query(By.css('[data-test-id="refresh-greeting-btn"]'));
    refreshBtn.nativeElement.click();

    expect(mockGreetingService.fetchGreeting).toHaveBeenCalledTimes(2);
  });

  it('should pass service streams to GreetingCardComponent', () => {
    const greetingCardDebug = fixture.debugElement.query(By.directive(GreetingCardComponent));
    const greetingCardInstance = greetingCardDebug.componentInstance as GreetingCardComponent;

    expect(greetingCardInstance.greeting).toBe('stub greeting');
    expect(greetingCardInstance.fact?.text).toContain('Fact from mock');
    expect(greetingCardInstance.loading).toBeFalsy();
    expect(greetingCardInstance.error).toBeNull();

    mockGreetingService.emit({ greeting: 'Updated', loading: true, error: 'Oops' });
    fixture.detectChanges();

    expect(greetingCardInstance.greeting).toBe('Updated');
    expect(greetingCardInstance.loading).toBeTruthy();
    expect(greetingCardInstance.error).toBe('Oops');
  });
});
