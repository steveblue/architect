import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Lazy3Component } from './lazy3.component';

const routes: Routes = [
  { path: '', component: Lazy3Component }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Lazy3RoutingModule { }
