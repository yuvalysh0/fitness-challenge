import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from './app-header/app-header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, BottomNavComponent, AppHeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
