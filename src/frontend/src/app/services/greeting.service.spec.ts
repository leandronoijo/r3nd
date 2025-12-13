import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Fact, GreetingService } from './greeting.service';

describe('GreetingService', () => {
  let service: GreetingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(GreetingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should emit greeting and fact when fetch succeeds', () => {
    const greetingValues: Array<string | null> = [];
    const factValues: Array<Fact | null> = [];
    const loadingValues: boolean[] = [];
    const errorValues: Array<string | null> = [];

    service.greeting$.subscribe((value) => greetingValues.push(value));
    service.fact$.subscribe((value) => factValues.push(value));
    service.loading$.subscribe((value) => loadingValues.push(value));
    service.error$.subscribe((value) => errorValues.push(value));

    const fixtureFact: Fact = {
      text: 'Primes are cool',
      language: 'en',
      source: 'tests',
      permalink: 'https://example.com/fact'
    };

    service.fetchGreeting();

    const req = httpMock.expectOne('/api/greetings');
    expect(req.request.method).toBe('GET');

    req.flush({ greeting: 'Hello R3ND', fact: fixtureFact }, {
      headers: { 'content-type': 'application/json' }
    });

    expect(greetingValues[greetingValues.length - 1]).toBe('Hello R3ND');
    expect(factValues[factValues.length - 1]).toEqual(fixtureFact);
    expect(loadingValues[loadingValues.length - 1]).toBeFalsy();
    expect(errorValues[errorValues.length - 1]).toBeNull();
  });

  it('should emit error message when fetch fails', () => {
    const errorValues: Array<string | null> = [];
    const loadingValues: boolean[] = [];
    const greetingValues: Array<string | null> = [];
    const factValues: Array<Fact | null> = [];

    service.error$.subscribe((value) => errorValues.push(value));
    service.loading$.subscribe((value) => loadingValues.push(value));
    service.greeting$.subscribe((value) => greetingValues.push(value));
    service.fact$.subscribe((value) => factValues.push(value));

    service.fetchGreeting();

    const req = httpMock.expectOne('/api/greetings');
    req.flush({ message: 'Server unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    expect(loadingValues[loadingValues.length - 1]).toBeFalsy();
    expect(errorValues[errorValues.length - 1]).toBe('Server unavailable');
    expect(greetingValues[greetingValues.length - 1]).toBeNull();
    expect(factValues[factValues.length - 1]).toBeNull();
  });
});
