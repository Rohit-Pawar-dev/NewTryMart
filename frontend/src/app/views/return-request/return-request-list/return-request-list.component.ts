import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReturnRequestService, ReturnRequest, ReturnRequestPagination } from '../../../services/returnRequest.service';


@Component({
  selector: 'app-return-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './return-request-list.component.html',
  styleUrls: ['./return-request-list.component.scss']
})
export class ReturnRequestListComponent implements OnInit {
  requests: ReturnRequest[] = [];
  selectedStatus: string = '';
  searchText: string = '';
  loading: boolean = false;

  // Pagination
  total: number = 0;
  limit: number = 10;
  offset: number = 0;
  totalPages: number = 1;
  currentPage: number = 1;

  constructor(private returnRequestService: ReturnRequestService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;
    this.offset = (page - 1) * this.limit;

    this.returnRequestService
      .getAll(this.selectedStatus, this.searchText, this.limit, this.offset)
      .subscribe({
        next: (res: ReturnRequestPagination) => {
          if (res.status) {
            this.requests = res.data;
            this.total = res.total;
            this.totalPages = res.totalPages;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

 
viewRequest(id: string) {
  // Navigates relative to current route
  this.router.navigate(['view', id], { relativeTo: this.route });
}

  // Pagination controls
  prevPage() {
    if (this.currentPage > 1) this.loadRequests(this.currentPage - 1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.loadRequests(this.currentPage + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.loadRequests(page);
  }
}
