import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import OrderDetailPage from 'src/sections/orders/view/order-detail-view'; // ✅ Correct import


// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Products - ${CONFIG.appName}`}</title>
      </Helmet>

      <OrderDetailPage />
    </>
  );
}
