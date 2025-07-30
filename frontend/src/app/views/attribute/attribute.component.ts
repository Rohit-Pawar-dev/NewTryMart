import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AttributeService, Attribute } from '../../services/attribute.service';

@Component({
    selector: 'app-attribute',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attribute.component.html',
})
export class AttributeComponent implements OnInit {
    attributes: Attribute[] = [];
    newAttribute: Attribute = { type: 'color', value: '' };
    selectedType: 'color' | 'size' | '' = ''; // '' means no filter

    // Pagination
    limit = 10;
    currentPage = 1;
    totalPages = 0;
    totalItems = 0;

    Math = Math;

    constructor(private attributeService: AttributeService) { }

    ngOnInit(): void {
        this.loadAttributes();
    }

    loadAttributes(): void {
        const offset = (this.currentPage - 1) * this.limit;

        this.attributeService
            .getAllAttributes('', this.limit, offset, this.selectedType)
            .subscribe({
                next: (res) => {
                    this.attributes = res.data;
                    this.totalItems = res.total;
                    this.totalPages = res.totalPages;
                },
                error: () => {
                    Swal.fire('Error', 'Failed to load attributes.', 'error');
                },
            });
    }

    createAttribute(): void {
        if (!this.newAttribute.type || !this.newAttribute.value) {
            Swal.fire('Validation Error', 'Both type and value are required.', 'warning');
            return;
        }

        this.attributeService.createAttribute(this.newAttribute).subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Attribute created successfully!',
                    timer: 2000,
                    showConfirmButton: false,
                });
                this.newAttribute = { type: 'color', value: '' };
                this.loadAttributes();
            },
            error: () => {
                Swal.fire('Error', 'Failed to create attribute.', 'error');
            },
        });
    }

    deleteAttribute(id: string): void {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                this.attributeService.deleteAttribute(id).subscribe({
                    next: () => {
                        Swal.fire('Deleted!', 'Attribute has been deleted.', 'success');
                        this.loadAttributes();
                    },
                    error: () => {
                        Swal.fire('Error!', 'Failed to delete attribute.', 'error');
                    },
                });
            }
        });
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAttributes();
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadAttributes();
    }
}
