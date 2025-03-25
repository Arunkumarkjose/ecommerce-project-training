import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProfilePage } from 'src/sections/profile';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Products - ${CONFIG.appName}`}</title>
      </Helmet>

      <ProfilePage />
    </>
  );
}
