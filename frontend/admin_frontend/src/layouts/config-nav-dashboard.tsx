import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor width="100%" height="100%" src={`/assets/icons/navbar/${name}.svg`} />
);

export const navData = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: icon('ic-analytics'),
  },
  {
    title: 'User',
    path: '/admin/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Product',
    path: '/admin/products',
    icon: icon('ic-cart'),
    info: (
      <Label color="error" variant="inverted">
        +3
      </Label>
    ),
  },
  {
    title: 'Categories',
    path: '/admin/categories',
    icon: icon('ic-blog'),
   
  },
  {
    title: 'Orders',
    path: '/admin/orders',
    icon: icon('ic-blog'),
   
  },
  {
    title: 'Blog',
    path: '/admin/blog',
    icon: icon('ic-blog'),
  },
  {
    title: 'Sign in',
    path: '/admin/sign-in',
    icon: icon('ic-lock'),
  },
  {
    title: 'Not found',
    path: '/404',
    icon: icon('ic-disabled'),
  },
];
