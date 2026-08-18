import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../shared/layouts/MainLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { ProtectedRoute } from '../shared/guards/ProtectedRoute';
import { AdminRoute } from '../shared/guards/AdminRoute';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { ServiceListPage } from '../features/services/pages/ServiceListPage';
import { ServiceDetailPage } from '../features/services/pages/ServiceDetailPage';
import { MyBookingsPage } from '../features/bookings/pages/MyBookingsPage';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { AdminServicesPage } from '../features/admin/pages/AdminServicesPage';
import { AdminServiceFormPage } from '../features/admin/pages/AdminServiceFormPage';
import { AdminBookingsPage } from '../features/admin/pages/AdminBookingsPage';
import { AdminServiceOverviewPage } from '../features/admin/pages/AdminServiceOverviewPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';
import { HomePage } from '../features/services/pages/HomePage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServiceListPage /> },
      { path: 'services/:id', element: <ServiceDetailPage /> },
      { path: 'login', element: <AuthPage mode="login" /> },
      { path: 'register', element: <AuthPage mode="register" /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'bookings', element: <MyBookingsPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/services', element: <AdminServicesPage /> },
              { path: '/admin/services/new', element: <AdminServiceFormPage /> },
              { path: '/admin/services/:id', element: <AdminServiceOverviewPage /> },
              { path: '/admin/services/:id/edit', element: <AdminServiceFormPage /> },
              { path: '/admin/bookings', element: <AdminBookingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
