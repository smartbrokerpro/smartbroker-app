// /middleware/withAuth.js
import { getSession } from 'next-auth/react';

export const withAuth = (handler) => {
  return async (req, res) => {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.session = session;
    return handler(req, res);
  };
};
