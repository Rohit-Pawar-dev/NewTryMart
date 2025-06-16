import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { UserService, User } from '../../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  // styleUrls: ['./user-edit.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ]
})
export class UserEditComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      // password: ['', Validators.minLength(8)], // Optional field
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.userService.getUser(this.userId).subscribe(
        (user) => {
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status
          });
        },
        (error) => {
          console.error('Error loading user:', error);
        }
      );
    }
  }

  onSubmit(): void {
    if (this.userForm.valid && this.userId) {
      this.isSubmitting = true;
      const updatedUser: Partial<User> = this.userForm.value;

      this.userService.updateUser(this.userId, updatedUser).subscribe(
        () => this.router.navigate(['/users']),
        (error) => {
          console.error('Error updating user:', error);
          this.isSubmitting = false;
        }
      );
    }
  }
}
