// pages/protected.js

import { useSession, getSession } from 'next-auth/react';

export default function ProtectedPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Access Denied</p>;
  }

  return <p>Protected Content for {session.user.name}</p>;
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
