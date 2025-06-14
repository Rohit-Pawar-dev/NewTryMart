import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { UserService, User } from '../../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrls: ['./user-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ]
})
export class UserAddComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      // role: ['user', Validators.required],
      status: ['active', Validators.required],
      // profilePicture: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const newUser: User = this.userForm.value;

      this.userService.createUser(newUser).subscribe(
        () => this.router.navigate(['/users']),
        (error) => {
          console.error('Error creating user:', error);
          this.isSubmitting = false;
        }
      );
    }
  }
}
