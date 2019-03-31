import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Lazy3Component } from './lazy3.component';
import { Lazy3RoutingModule } from './lazy3-routing.module';

@NgModule({
  declarations: [Lazy3Component],
  imports: [
    CommonModule,
    Lazy3RoutingModule
  ]
})
export class Lazy3Module { }
