import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { OrdersView } from 'src/sections/orders/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`orders - ${CONFIG.appName}`}</title>
      </Helmet>

      <OrdersView />
    </>
  );
}
