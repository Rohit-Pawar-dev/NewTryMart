import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  imports: [CommonModule]
})
export class UserViewComponent implements OnInit {
  user: User | null = null;
  userId: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.userService.getUser(this.userId).subscribe({
        next: (userData) => {
          this.user = userData;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'User not found or failed to fetch.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'Invalid user ID.';
      this.isLoading = false;
    }
  }
}
