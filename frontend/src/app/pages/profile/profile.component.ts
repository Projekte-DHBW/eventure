import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  protected auth = inject(AuthService);
  protected isLoggedIn = this.auth.isAuthenticated();

  protected fullName: string | null = null;
  protected userID: string | null = null;

  ngOnInit() {
    this.fullName = this.auth.getFullName();
    this.userID = this.auth.getUserId();
  }
}
