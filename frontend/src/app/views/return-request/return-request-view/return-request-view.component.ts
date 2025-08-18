import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReturnRequestService, ReturnRequest } from '../../../services/returnRequest.service';

@Component({
  selector: 'app-return-request-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './return-request-view.component.html',
  styleUrls: ['./return-request-view.component.scss']
})
// export class ReturnRequestViewComponent implements OnInit {
//   request?: ReturnRequest;
//   loading = false;

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
//         if (res.status) this.request = res.data;
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading = false;
//       }
//     });
//   }
// }
export class ReturnRequestViewComponent implements OnInit {
  request?: ReturnRequest;
  loading = false;
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
      }
    });
  }

  updateStatus(newStatus: 'Approved' | 'Denied') {
    if (!this.request) return;

    this.returnRequestService.changeStatus(this.request._id, newStatus, this.adminResponse).subscribe({
      next: (res) => {
        if (res.status) {
          this.request!.status = newStatus;
          this.request!.admin_response = this.adminResponse;
          alert('Status updated successfully');
        }
      },
      error: (err) => console.error(err)
    });
  }
}
