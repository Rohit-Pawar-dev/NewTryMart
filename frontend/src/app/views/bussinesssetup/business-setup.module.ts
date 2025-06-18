import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessSetupComponent } from './business-setup.component';

@NgModule({
  declarations: [BusinessSetupComponent],  // ✅ declare it here
  imports: [CommonModule],                // ✅ import needed modules
  exports: [BusinessSetupComponent]       // ✅ only export after declaring
})
export class BusinessSetupModule {}
