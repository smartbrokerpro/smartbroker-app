// /pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

async function findUserWithOrganization(email) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  console.log('Querying user with email:', email.toLowerCase());

  const user = await db.collection('users').findOne({ 
    email: email.toLowerCase(),
    active: { $ne: false }
  }, {
    projection: {
      _id: 1,
      name: 1,
      email: 1,
      image: 1,
      role: 1,
      permissions: 1,
      customPermissions: 1,
      active: 1,
      organizationId: 1,
      createdAt: 1,
      updatedAt: 1
    }
  });

  if (!user) return null;

  const organization = await db.collection('organizations').findOne({ 
    _id: new ObjectId(user.organizationId) 
  });

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
        const freshUserData = await findUserWithOrganization(token.user.email);
        if (freshUserData) {
          session.user = {
            id: freshUserData._id.toString(),
            name: freshUserData.name,
            email: freshUserData.email,
            image: freshUserData.image,
            organization: freshUserData.organization,
            permissions: freshUserData.permissions,
            role: freshUserData.role,
            active: freshUserData.active,
            customPermissions: freshUserData.customPermissions,
            createdAt: freshUserData.createdAt,
            updatedAt: freshUserData.updatedAt
          };
        }
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
          // Pasar todos los campos relevantes
          token.user = {
            id: userWithOrganization._id.toString(),
            name: userWithOrganization.name,
            email: userWithOrganization.email,
            image: userWithOrganization.image,
            organization: userWithOrganization.organization,
            permissions: userWithOrganization.permissions,
            role: userWithOrganization.role,
            active: userWithOrganization.active,
            customPermissions: userWithOrganization.customPermissions,
            createdAt: userWithOrganization.createdAt,
            updatedAt: userWithOrganization.updatedAt
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
