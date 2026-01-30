
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { staffGuard } from './core/staff.guard';
// import { PaymentListComponent } from './features/payments/payment-list/payment-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // public
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },

  // Admin public logins (already added earlier)
  { path: 'admin/login', loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'staff/login', loadComponent: () => import('./features/staff/staff-login/staff-login.component').then(m => m.StaffLoginComponent) },

  // Passenger protected (unchanged)
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'book-ticket', canActivate: [authGuard], loadComponent: () => import('./features/book-ticket/book-ticket.component').then(m => m.BookTicketComponent) },
  { path: 'my-reservations', canActivate: [authGuard], loadComponent: () => import('./features/my-reservations/my-reservations.component').then(m => m.MyReservationsComponent) },
  { path: 'payments', canActivate: [authGuard], loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent) },
  {path: 'payments/list', canActivate: [authGuard], loadComponent: () => import('./features/payments/payment-list/payment-list.component').then(m => m.PaymentListComponent)},
  { path: 'ticket', canActivate: [authGuard], loadComponent: () => import('./features/ticket/ticket.component').then(m => m.TicketComponent) },
  { path: 'my-profile', canActivate: [authGuard], loadComponent: () => import('./features/my-profile/my-profile.component').then(m => m.MyProfileComponent) },
  { path: 'edit-profile', canActivate: [authGuard], loadComponent: () => import('./features/edit-profile/edit-profile.component').then(m => m.EditProfileComponent) },
  { path: 'register-complaint', canActivate: [authGuard], loadComponent: () => import('./features/register-complaint/register-complaint.component').then(m => m.RegisterComplaintComponent) },
  { path: 'view-complaints', canActivate: [authGuard], loadComponent: () => import('./features/view-complaints/view-complaints.component').then(m => m.ViewComplaintsComponent) },

  // Admin protected (role-based only)
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-home/admin-home.component').then(m => m.AdminHomeComponent) },
  { path: 'admin/complaints', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-complaints/admin-complaints.component').then(m => m.AdminComplaintsComponent) },
  { path: 'admin/search-reservations', canActivate: [adminGuard], loadComponent: () => import('./features/admin/search-reservations/search-reservations.component').then(m => m.SearchReservationsComponent) },

  // Staff protected (role-based only)
  { path: 'staff', canActivate: [staffGuard], loadComponent: () => import('./features/staff/staff-home/staff-home.component').then(m => m.StaffHomeComponent) },
  { path: 'staff/complaints', canActivate: [staffGuard], loadComponent: () => import('./features/staff/staff-complaints/staff-complaints.component').then(m => m.StaffComplaintsComponent) },

  { path: '**', redirectTo: 'login' }
];
