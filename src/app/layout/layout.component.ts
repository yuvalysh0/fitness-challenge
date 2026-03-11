import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, BottomNavComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
