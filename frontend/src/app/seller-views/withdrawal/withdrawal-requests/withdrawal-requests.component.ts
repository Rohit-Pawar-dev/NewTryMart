// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../../environments/environment';
// import Swal from 'sweetalert2';


// interface WithdrawalRequest {
//   _id: string;
//   amount: number;
//   status: string;
//   requested_at: string;
// }

// @Component({
//   selector: 'app-withdrawal-requests',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './withdrawal-requests.component.html',
// })
// export class WithdrawalRequestsComponent implements OnInit {
//   withdrawalRequests: WithdrawalRequest[] = [];
//   withdrawAmount: number | null = null;
//   walletAmount: number = 0;
//   message: string = '';
//   page: number = 1;
//   limit: number = 10;
//   totalPages: number = 1;
//   statusFilter: string = '';
//   search: string = '';

//   constructor(private http: HttpClient) { }
//   private apiUrl = `${environment.apiUrl}/sellers`;

//   ngOnInit(): void {
//     this.fetchRequests();
//     this.fetchWallet();
//   }
//   // fetchRequests(): void {
//   //   let params: any = {
//   //     page: this.page,
//   //     limit: this.limit,
//   //   };
//   //   if (this.statusFilter) params.status = this.statusFilter;
//   //   if (this.search) params.search = this.search;

//   //   this.http.get<any>(`${this.apiUrl}/withdrawal-requests`, { params })
//   //     .subscribe({
//   //       next: (res) => {
//   //         if (res.status) {
//   //           this.withdrawalRequests = res.data;
//   //           this.totalPages = res.meta.totalPages;
//   //         }
//   //       },
//   //       error: (err) => {
//   //         console.error(err);
//   //         Swal.fire({
//   //           icon: 'error',
//   //           title: 'Error',
//   //           text: 'Error fetching withdrawal requests'
//   //         });
//   //       }
//   //     });
//   // }
//   fetchRequests(): void {
//     const params: any = {
//       page: this.page,
//       limit: this.limit
//     };
//     if (this.statusFilter) params.status = this.statusFilter;
//     if (this.search) params.search = this.search;

//     this.http.get<any>(`${this.apiUrl}/withdrawal-requests`, { params })
//       .subscribe({
//         next: (res) => {
//           if (res.status) {
//             this.withdrawalRequests = res.data;
//             this.totalPages = res.meta?.totalPages || 1;
//             this.page = res.meta?.currentPage || this.page;
//           } else {
//             this.withdrawalRequests = [];
//             this.totalPages = 1;
//           }
//         },
//         error: (err) => {
//           console.error(err);
//           Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'Error fetching withdrawal requests'
//           });
//         }
//       });
//   }



//   fetchWallet(): void {
//     this.http.get<any>(`${this.apiUrl}/wallet`)
//       .subscribe({
//         next: (res) => {
//           if (res.status) this.walletAmount = res.data.wallet_amount;
//         },
//         error: (err) => console.error(err)
//       });
//   }

//   requestWithdrawal(): void {
//     if (!this.withdrawAmount || this.withdrawAmount <= 0) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Invalid Amount',
//         text: 'Enter a valid withdrawal amount'
//       });
//       return;
//     }

//     Swal.fire({
//       title: 'Confirm Withdrawal',
//       text: `Are you sure you want to withdraw ₹${this.withdrawAmount}?`,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, withdraw',
//       cancelButtonText: 'Cancel'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.http.post<any>(`${this.apiUrl}/withdrawal-request`, { amount: this.withdrawAmount })
//           .subscribe({
//             next: (res) => {
//               if (res.status) {
//                 Swal.fire({
//                   icon: 'success',
//                   title: 'Success',
//                   text: res.message
//                 });
//                 this.withdrawAmount = null;
//                 this.fetchRequests();
//                 this.fetchWallet();
//               } else {
//                 Swal.fire({
//                   icon: 'error',
//                   title: 'Error',
//                   text: res.message
//                 });
//               }
//             },
//             error: (err) => {
//               const msg = err.error?.message || 'Something went wrong';
//               Swal.fire({
//                 icon: 'error',
//                 title: 'Balance Insufficient',
//                 text: msg
//               });
//             }
//           });
//       }
//     });
//   }
// changePage(newPage: number): void {
//   if (newPage < 1 || newPage > this.totalPages) return;
//   this.page = newPage;
//   this.fetchRequests();
// }

// }
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: string;
  requested_at: string;
}

@Component({
  selector: 'app-withdrawal-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './withdrawal-requests.component.html',
})
export class WithdrawalRequestsComponent implements OnInit {
  withdrawalRequests: WithdrawalRequest[] = [];
  withdrawAmount: number | null = null;
  walletAmount: number = 0;
  message: string = '';
  page: number = 1;
  limit: number = 10;
  totalPages: number = 1;
  statusFilter: string = '';
  search: string = '';

  constructor(private http: HttpClient) {}
  private apiUrl = `${environment.apiUrl}/sellers`;

  ngOnInit(): void {
    this.fetchRequests();
    this.fetchWallet();
  }

  fetchRequests(): void {
    const params: any = {
      page: this.page,
      limit: this.limit
    };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;

    this.http.get<any>(`${this.apiUrl}/withdrawal-requests`, { params })
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.withdrawalRequests = res.data || [];
            this.totalPages = res.totalPages || 1;
            this.page = res.page || this.page;
          } else {
            this.withdrawalRequests = [];
            this.totalPages = 1;
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error fetching withdrawal requests'
          });
        }
      });
  }

  fetchWallet(): void {
    this.http.get<any>(`${this.apiUrl}/wallet`)
      .subscribe({
        next: (res) => {
          if (res.status) this.walletAmount = res.data.wallet_amount;
        },
        error: (err) => console.error(err)
      });
  }

  requestWithdrawal(): void {
    if (!this.withdrawAmount || this.withdrawAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Amount',
        text: 'Enter a valid withdrawal amount'
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Withdrawal',
      text: `Are you sure you want to withdraw ₹${this.withdrawAmount}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, withdraw',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post<any>(`${this.apiUrl}/withdrawal-request`, { amount: this.withdrawAmount })
          .subscribe({
            next: (res) => {
              if (res.status) {
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: res.message
                });
                this.withdrawAmount = null;
                this.fetchRequests();
                this.fetchWallet();
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: res.message
                });
              }
            },
            error: (err) => {
              const msg = err.error?.message || 'Something went wrong';
              Swal.fire({
                icon: 'error',
                title: 'Balance Insufficient',
                text: msg
              });
            }
          });
      }
    });
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.fetchRequests();
  }
}
