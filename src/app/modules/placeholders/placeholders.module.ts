import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PlaceholderComponent } from './components/placeholder.component';
import { routes } from './placeholders.routes';

@NgModule({
  declarations: [
    PlaceholderComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PlaceholdersModule { }
