import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-business-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-setup.component.html',
})
export class BusinessSetupComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  originalData: any = {};
  selectedLogoFile: File | null = null;
  previewLogoUrl: string | null = null;

  business = {
    companyName: '',
    phone: '',
    companyEmail: '',
    companyAddress: '',
    country: '',
    timezone: '',
    websiteLogo: '',
    deliveryCharges: 0,
    sellerCommision: 0,
    razorPayKey: '',
    display_cod_payment: true,
    display_online_payment: true,
    display_wallet_payment: true
  };

  private apiUrl = `${environment.apiUrl}/admin/setting/business-setup`;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBusinessSetup();
  }

  fetchBusinessSetup(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        const data = res?.data;
        if (res?.status && data) {
          this.business = { ...data };
          this.originalData = { ...data };
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to load business setup information.';
        console.error('Fetch Error:', err);
        Swal.fire('Error', this.error, 'error');
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        Swal.fire('Invalid File', 'Only PNG files are allowed for the logo.', 'error');
        this.selectedLogoFile = null;
        this.previewLogoUrl = null;
        const input = document.getElementById('logoInput') as HTMLInputElement;
        if (input) input.value = '';
        return;
      }

      this.selectedLogoFile = file;

      // Generate live preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewLogoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }


  async onUpdate(): Promise<void> {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update the business setup?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) {
      return; // User cancelled the action
    }

    this.success = null;
    this.error = null;
    this.isLoading = true;

    try {
      // Upload logo if selected
      if (this.selectedLogoFile) {
        const formData = new FormData();
        formData.append('logo', this.selectedLogoFile);

        const uploadRes = await this.http
          .post<any>(`${environment.apiUrl}/upload-logo`, formData)
          .toPromise();

        if (uploadRes?.path) {
          this.business.websiteLogo = uploadRes.path;
        }
      }

      // Update business setup
      await this.http.put<any>(this.apiUrl, this.business).toPromise();

      this.originalData = { ...this.business };
      this.selectedLogoFile = null;
      this.previewLogoUrl = null;
      this.isLoading = false;

      Swal.fire('Success', 'Business setup updated successfully.', 'success');
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.error?.message || 'Failed to update business setup.';
      Swal.fire('Error', this.error ?? 'An unknown error occurred.', 'error');
    }
  }


  onCancel(): void {
    this.business = { ...this.originalData };
    this.selectedLogoFile = null;
    this.previewLogoUrl = null;
    this.success = null;
    this.error = null;

    // Clear file input visually
    const input = document.getElementById('logoInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  getFullLogoUrl(): string {
    if (!this.business.websiteLogo) return '';
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${this.business.websiteLogo}`;
  }
}
