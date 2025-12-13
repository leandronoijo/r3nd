import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Observable } from 'rxjs';

import { GreetingCardComponent } from '../../components/greeting-card/greeting-card.component';
import { Fact, GreetingService } from '../../services/greeting.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, GreetingCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly greeting$: Observable<string | null>;
  readonly fact$: Observable<Fact | null>;
  readonly loading$: Observable<boolean>;
  readonly error$: Observable<string | null>;

  constructor(private readonly greetingService: GreetingService) {
    this.greeting$ = greetingService.greeting$;
    this.fact$ = greetingService.fact$;
    this.loading$ = greetingService.loading$;
    this.error$ = greetingService.error$;
  }

  ngOnInit(): void {
    this.greetingService.fetchGreeting();
  }

  refreshGreeting(): void {
    this.greetingService.fetchGreeting();
  }
}
