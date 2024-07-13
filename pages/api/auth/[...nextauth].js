import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

async function findUserWithCompany(email) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  console.log('Database Name:', db.databaseName);
  console.log('Connecting to database...');
  console.log('Querying user with email:', email.toLowerCase());

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  console.log('User found:', user);

  if (!user) return null;

  const companyId = user.companyId;
  console.log('Querying company with id:', companyId);

  const company = await db.collection('companies').findOne({ _id: new ObjectId(companyId) });
  console.log('Company found:', company);

  if (!company) return null;

  user.company = company;
  return user;
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/sign-in',
    signOut: '/auth/sign-out',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: null,
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token && token.user) {
        console.log('Token user in session callback:', token.user);
        session.user = token.user;
      }
      if (token?.error) {
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        console.log('Profile received in jwt callback:', profile);
        const userWithCompany = await findUserWithCompany(profile.email);
        if (userWithCompany) {
          console.log('User with company in jwt callback:', userWithCompany);
          token.user = {
            id: userWithCompany._id.toString(),
            name: userWithCompany.name,
            email: userWithCompany.email,
            company: userWithCompany.company,
            permissions: userWithCompany.permissions
          };
        } else {
          console.log('User or company not found');
          token.error = 'AuthError';
          return { ...token, error: 'AuthError' };
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      const userWithCompany = await findUserWithCompany(profile.email);
      if (!userWithCompany) {
        console.log('User or company not found');
        return '/auth/sign-in?error=AuthError'; // Redirigir al inicio de sesión con el error
      }
      return true;
    }
  }
});
