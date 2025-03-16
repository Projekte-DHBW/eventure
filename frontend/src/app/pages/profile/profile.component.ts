import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../types/user';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  constructor(private userService: UserService) {}
  protected auth = inject(AuthService);
  protected isLoggedIn = this.auth.isAuthenticated();

  protected fullName: string | null = null;
  protected userID: string | null = null;
  protected firstname: string | null = null;
  protected lastname: string | null = null;

  users: User[] = [];

  ngOnInit() {
    this.fullName = this.auth.getFullName();
    this.userID = this.auth.getUserId();
    this.firstname = this.auth.getfirstName();
    this.lastname = this.auth.getlastName();
    this.loadUser();
  }

  loadUser() {
    this.userService.getUsers().subscribe((users) => {
      console.log('Users-', users);
      this.users = users;
    });
  }
}
