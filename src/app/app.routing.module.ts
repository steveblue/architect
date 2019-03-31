import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

const routes: Routes = [
  { path: '', loadChildren: './routes/lazy1/lazy1.module#Lazy1Module' },
  { path: 'lazy2', loadChildren: './routes/lazy2/lazy2.module#Lazy2Module' },
  { path: 'lazy3', loadChildren: './routes/lazy3/lazy3.module#Lazy3Module' }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
