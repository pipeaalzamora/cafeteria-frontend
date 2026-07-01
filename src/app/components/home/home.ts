import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.css'
})
export class HomeComponent {
  constructor(private router: Router) {}

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }
}
