// user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

// Import SweetAlert2
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  // styleUrls: ['./user-list.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  isLoading = true;

  searchTerm = '';
  page = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(this.searchTerm, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.users = res.data;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        Swal.fire('Error', 'Failed to load users.', 'error');
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.page = 1;
    this.loadUsers();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadUsers();
    }
  }

  deleteUser(userId: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.users = this.users.filter(user => user._id !== userId);
            Swal.fire('Deleted!', 'User has been deleted.', 'success');
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            Swal.fire('Error', 'Failed to delete user.', 'error');
          }
        });
      }
    });
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.userService.updateUser(user._id!, { status: newStatus }).subscribe({
      next: () => {
        user.status = newStatus; // Optional: avoid full reload
        Swal.fire('Updated!', `User status changed to ${newStatus}.`, 'success');
      },
      error: (err) => {
        console.error('Error updating status:', err);
        Swal.fire('Error', 'Failed to update status.', 'error');
      }
    });
  }
}
