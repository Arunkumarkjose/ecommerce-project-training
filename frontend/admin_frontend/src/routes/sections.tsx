import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { varAlpha } from 'src/theme/styles';
import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import PrivateRoute from './PrivateRoute'; // Import the PrivateRoute component

// ----------------------------------------------------------------------

export const HomePage = lazy(() => import('src/pages/home'));
export const CategoryPage = lazy(() => import('src/pages/Categories'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const OrdersPage = lazy(() => import('src/pages/orders'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const OrderDetailPage = lazy(() => import('src/pages/orderDetail'));

// ----------------------------------------------------------------------

const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export function Router() {
  return useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense fallback={renderFallback}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { path:'/admin/dashboard',element: <PrivateRoute><HomePage /></PrivateRoute>, index: true },
        { path: '/admin/user', element: <PrivateRoute><UserPage /></PrivateRoute> },
        { path: '/admin/products', element: <PrivateRoute><ProductsPage /></PrivateRoute> },
        { path: '/admin/blog', element: <PrivateRoute><BlogPage /></PrivateRoute> },
        { path: '/admin/categories', element: <PrivateRoute><CategoryPage /></PrivateRoute> },
        { path: '/admin/orders', element: <PrivateRoute><OrdersPage /></PrivateRoute> },
        { path: '/admin/orders/:orderID', element: <PrivateRoute><OrderDetailPage /></PrivateRoute> }, //  Add order details route
      ],
    },
    {
      path: '/admin/sign-in',
      element: (
        <AuthLayout>
          <SignInPage />
        </AuthLayout>
      ),
    },
    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '/admin/*',
      element: <Navigate to="/admin/sign-in" replace />,
    },
  ]);
}
