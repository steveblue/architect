import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Lazy2Component } from './lazy2.component';
import { Lazy2RoutingModule } from './lazy2-routing.module';

@NgModule({
  declarations: [Lazy2Component],
  imports: [
    CommonModule,
    Lazy2RoutingModule
  ]
})
export class Lazy2Module { }
