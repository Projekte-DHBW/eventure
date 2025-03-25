import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../types/user';

@Component({
  selector: 'app-profile-id',
  imports: [RouterModule],
  templateUrl: './profile-id.component.html',
  styleUrl: './profile-id.component.css',
})
export class ProfileIdComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  protected auth = inject(AuthService);
  protected isLoggedIn = this.auth.isAuthenticated();

  protected fullName: string | null = null;
  protected userID: string | null = null;
  protected firstname: string | null = null;
  protected lastname: string | null = null;
  protected email: string | null = null;
  protected avInitial = '';
  protected isOwnProfile = false;

  users: User[] = [];
  currentUser: User | null = null;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const profileId = params['id'];
      this.userID = params['id'];
      this.loadUserById(profileId);
      
      const loggedInUserId = this.auth.getUserId();
      this.isOwnProfile = profileId === loggedInUserId;

      if (this.isOwnProfile) {
        this.email = this.auth.getEmail();
      }
    });

    this.loadUsers();
  }

  loadUserById(userId: string) {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.firstname = user.firstName;
        this.lastname = user.lastName;
        this.fullName = `${user.firstName} ${user.lastName}`;

        const firstInitial = this.firstname
          ? this.firstname.charAt(0).toUpperCase()
          : '';
        const lastInitial = this.lastname
          ? this.lastname.charAt(0).toUpperCase()
          : '';
        this.avInitial = `${firstInitial}${lastInitial}`;
      },
      error: (error) => {
        console.error('Error loading user:', error);
      },
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        console.log('Users-', users);
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }
}
