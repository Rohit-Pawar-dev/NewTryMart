import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from '../../../../app/services/banner.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-banner-edit',
  templateUrl: './banner-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerEditComponent implements OnInit {
  form: FormGroup;
  id: string = '';
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private bannerService: BannerService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      image: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.bannerService.getBanner(this.id).subscribe((banner) => {
      this.form.patchValue(banner);
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    this.bannerService.updateBanner(this.id, this.form.value).subscribe({
      next: () => this.router.navigate(['/banners']),
      error: () => {
        // Optionally handle the error
        this.isSubmitting = false;
      }
    });
  }
}
