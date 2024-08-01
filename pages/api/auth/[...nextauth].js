// /pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

async function findUserWithOrganization(email) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  console.log('Database Name:', db.databaseName);
  console.log('Connecting to database...');
  console.log('Querying user with email:', email.toLowerCase());

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  console.log('User found:', user);

  if (!user) return null;

  const organizationId = user.organizationId;
  console.log('Querying organization with id:', organizationId);

  const organization = await db.collection('organizations').findOne({ _id: new ObjectId(organizationId) });
  console.log('Organization found:', organization);

  if (!organization) return null;

  user.organization = organization;
  return user;
}

const authOptions = {
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
        session.user = token.user;
      }
      if (token?.error) {
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const userWithOrganization = await findUserWithOrganization(profile.email);
        if (userWithOrganization) {
          token.user = {
            id: userWithOrganization._id.toString(),
            name: userWithOrganization.name,
            email: userWithOrganization.email,
            organization: userWithOrganization.organization,
            permissions: userWithOrganization.permissions
          };
        } else {
          console.log('User or organization not found');
          token.error = 'AuthError';
          return { ...token, error: 'AuthError' };
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      const userWithOrganization = await findUserWithOrganization(profile.email);
      if (!userWithOrganization) {
        console.log('User or organization not found');
        return '/auth/sign-in?error=AuthError';
      }
      return true;
    }
  }
};

export default NextAuth(authOptions);
export { authOptions };
