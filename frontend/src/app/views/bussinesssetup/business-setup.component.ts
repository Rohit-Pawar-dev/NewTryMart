import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-setup.component.html',
})
export class BusinessSetupComponent {
  isLoading = false;
  error: string | null = null;

  business = {
    name: 'ABC Enterprises',
    phone: '+91-9876543210',
    email: 'contact@abcenterprises.com',
    address: '123, Main Road, Indore, MP - 452001',
    country: 'India',
    timezone: 'Asia/Kolkata'
  };

  onSubmit() {
    console.log('Submitted Business Info:', this.business);
    alert('Form submitted successfully!');
  }
}
