import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { GreetingCardComponent } from './greeting-card.component';

describe('GreetingCardComponent', () => {
  let fixture: ComponentFixture<GreetingCardComponent>;
  let component: GreetingCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreetingCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GreetingCardComponent);
    component = fixture.componentInstance;
  });

  it('should render loading indicator when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();

    const loading = fixture.debugElement.query(By.css('[data-test-id="greeting-loading"]'));
    expect(loading).toBeTruthy();
  });

  it('should show error message and hide greeting when error exists', () => {
    component.error = 'Network failure';
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('[data-test-id="greeting-error"]'));
    const greetingText = fixture.debugElement.query(By.css('[data-test-id="greeting-text"]'));

    expect(error).toBeTruthy();
    expect(greetingText).toBeNull();
  });

  it('should display greeting and fact when provided', () => {
    component.loading = false;
    component.error = null;
    component.greeting = 'Hello from tests';
    component.fact = {
      text: 'The sun rises in the east.',
      language: 'en',
      source: 'tests',
      permalink: 'https://example.com/fact'
    };

    fixture.detectChanges();

    const greetingEl = fixture.debugElement.query(By.css('[data-test-id="greeting-text"]'));
    const factText = fixture.debugElement.query(By.css('[data-test-id="greeting-fact-text"]'));
    const factLink = fixture.debugElement.query(By.css('[data-test-id="greeting-fact-link"]'));

    expect(greetingEl?.nativeElement.textContent).toContain('Hello from tests');
    expect(factText?.nativeElement.textContent).toContain('The sun rises in the east.');
    expect(factLink).toBeTruthy();
    expect(factLink?.nativeElement.getAttribute('href')).toBe('https://example.com/fact');
  });
});
