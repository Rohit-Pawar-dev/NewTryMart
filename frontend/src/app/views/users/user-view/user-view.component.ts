import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  // styleUrls: ['./user-view.component.scss'],
  imports: [CommonModule],
})
export class UserViewComponent implements OnInit {
  user: User | null = null;
  userId: string | null = null;
  isLoading = true;
  error: string | null = null;
  mediaUrl=  environment.mediaUrl;
  imageFailedToLoad = false;


  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

 ngOnInit(): void {
  this.userId = this.route.snapshot.paramMap.get('id');
  
  if (!this.userId) {
    this.error = 'Invalid user ID.';
    this.isLoading = false;
    return;
  }

  this.userService.getUser(this.userId).subscribe({
    next: (userData) => {
      this.user = {
        ...userData,
        profilePicture: userData.profilePicture
          ? this.mediaUrl + userData.profilePicture
          : "./assets/user_default.png"
      };

      console.log(this.user);
      this.isLoading = false;
    },
    error: (err) => {
      this.error = 'User not found or failed to fetch.';
      this.isLoading = false;
    },
  });
}
onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = 'assets/images/user_default.png';
  this.imageFailedToLoad = true;
}


}
