import NextAuth from "next-auth"
// TODO-CLAUDE: Configure NextAuth providers (Google, Email)
// and Prisma adapter.

// Example with credentials provider for stubbing
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@myoflow/db";

const handler = NextAuth({
  providers: [
    // TODO-CLAUDE: Add GoogleProvider and EmailProvider
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.email) return null;
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          // For dev only: auto-create user if not found
          if (!user) {
             // This is insecure for production, for dev seed only.
             if (process.env.NODE_ENV === 'development' && credentials.email === 'dev@myoflow.local') {
                return prisma.user.findUnique({ where: { email: 'dev@myoflow.local' } });
             }
             return null;
          }
          return user;
        },
      })
  ],
  session: {
    strategy: "jwt",
  },
  // TODO-CLAUDE: Add PrismaAdapter
  // adapter: PrismaAdapter(prisma),
  callbacks: {
    // TODO-CLAUDE: Add callbacks to include therapistId and role in session/token
  }
})

export { handler as GET, handler as POST }


