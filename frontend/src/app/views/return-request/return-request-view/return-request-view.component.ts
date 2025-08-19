// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms'; 
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { ReturnRequestService, ReturnRequest } from '../../../services/returnRequest.service';

// @Component({
//   selector: 'app-return-request-view',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './return-request-view.component.html',
//   styleUrls: ['./return-request-view.component.scss']
// })
// export class ReturnRequestViewComponent implements OnInit {
//   request?: ReturnRequest;
//   loading = false;
//   adminResponse: string = '';

//   constructor(
//     private route: ActivatedRoute,
//     private returnRequestService: ReturnRequestService
//   ) {}

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id) this.loadRequest(id);
//   }

//   loadRequest(id: string) {
//     this.loading = true;
//     this.returnRequestService.getById(id).subscribe({
//       next: (res) => {
//         if (res.status) {
//           this.request = res.data;
//           this.adminResponse = res.data.admin_response || '';
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading = false;
//       }
//     });
//   }

//   updateStatus(newStatus: 'Approved' | 'Denied') {
//     if (!this.request) return;

//     this.returnRequestService.changeStatus(this.request._id, newStatus, this.adminResponse).subscribe({
//       next: (res) => {
//         if (res.status) {
//           this.request!.status = newStatus;
//           this.request!.admin_response = this.adminResponse;
//           alert('Status updated successfully');
//         }
//       },
//       error: (err) => console.error(err)
//     });
//   }
// }
// return-request-view.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReturnRequestService, ReturnRequest } from '../../../services/returnRequest.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-return-request-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './return-request-view.component.html',
  styleUrls: ['./return-request-view.component.scss']
})
export class ReturnRequestViewComponent implements OnInit {
  request?: ReturnRequest;
  loading = false;
  saving = false;
  adminResponse: string = '';

  constructor(
    private route: ActivatedRoute,
    private returnRequestService: ReturnRequestService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadRequest(id);
  }

  loadRequest(id: string) {
    this.loading = true;
    this.returnRequestService.getById(id).subscribe({
      next: (res) => {
        if (res.status) {
          this.request = res.data;
          this.adminResponse = res.data.admin_response || '';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        Swal.fire('Error', 'Failed to load return request.', 'error');
      }
    });
  }

  updateStatus(newStatus: 'Approved' | 'Denied' | 'Returned') {
    if (!this.request || this.request.status === 'Returned') return;

    Swal.fire({
      title: `Are you sure?`,
      text: `You are about to change the status to "${newStatus}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.saving = true;
        this.returnRequestService.changeStatus(this.request!._id, newStatus, this.adminResponse).subscribe({
          next: (res) => {
            if (res.status) {
              this.request!.status = newStatus;
              this.request!.admin_response = this.adminResponse;

              Swal.fire('Updated!', 'Return request status updated successfully.', 'success');
            }
            this.saving = false;
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'Failed to update status.', 'error');
            this.saving = false;
          }
        });
      }
    });
  }
}
