import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppRoute } from '../../core/enums';

interface HubCard {
  readonly route: string;
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
}

@Component({
  selector: 'app-progress-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './progress-hub.component.html',
  styleUrl: './progress-hub.component.scss',
})
export class ProgressHubComponent {
  readonly cards: HubCard[] = [
    {
      route: AppRoute.Progress,
      icon: 'photo_library',
      title: 'Progress Photos',
      subtitle: 'Front & side shots with weight trend',
    },
    {
      route: AppRoute.Measurements,
      icon: 'straighten',
      title: 'Measurements',
      subtitle: 'Body measurements logged over time',
    },
    {
      route: AppRoute.History,
      icon: 'calendar_today',
      title: 'History',
      subtitle: 'Past days, habits, and completion status',
    },
  ];
}
