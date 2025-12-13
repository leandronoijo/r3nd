import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';

import { Fact } from '../../services/greeting.service';

@Component({
  selector: 'app-greeting-card',
  standalone: true,
  imports: [CommonModule, CardModule, MessageModule, ProgressBarModule, ButtonModule],
  templateUrl: './greeting-card.component.html',
  styleUrl: './greeting-card.component.scss'
})
export class GreetingCardComponent {
  @Input() greeting: string | null = null;
  @Input() fact: Fact | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  protected readonly fallbackMessage = 'Awaiting the latest greeting...';
}
