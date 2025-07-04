// static-pages.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-static-pages',
  standalone: true,
  imports: [CommonModule, FormsModule, CKEditorModule],
  templateUrl: './static-pages.component.html',
})
export class StaticPagesComponent {
  public Editor = ClassicEditor;
  selectedTab = 0; // Initially show the first page tab

  public pages: any[] = [];
  public loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/page`).subscribe({
      next: (res) => {
        this.pages = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Failed to load static pages.');
      },
    });
  }

  updatePage(page: any) {
    this.http
      .put(`${environment.apiUrl}/page/${page._id}`, {
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: page.status,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: `${page.title} updated successfully.`,
            confirmButtonColor: '#2563eb',
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: `Failed to update ${page.title}.`,
            confirmButtonColor: '#ef4444',
          });
        },
      });
  }
}
