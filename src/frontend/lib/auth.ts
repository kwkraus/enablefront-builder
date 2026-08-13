import { getServerSession as nextGetServerSession, type AuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

const isGuid = (value: string | undefined) =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  )

const readRequiredGuid = (name: string): string => {
  const value = process.env[name]?.trim()

  if (!isGuid(value)) {
    throw new Error(
      `Invalid Azure AD config: ${name} must be a GUID. Check src/frontend/.env.local and restart the Next.js server.`,
    )
  }

  return value as string
}

const clientId = readRequiredGuid('AZURE_AD_CLIENT_ID')
const tenantId = readRequiredGuid('AZURE_AD_TENANT_ID')
const clientSecret = process.env.AZURE_AD_CLIENT_SECRET?.trim() ?? ''

if (!clientSecret) {
  throw new Error(
    'Invalid Azure AD config: AZURE_AD_CLIENT_SECRET is missing. Check src/frontend/.env.local and restart the Next.js server.',
  )
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId,
      clientSecret,
      tenantId,
      authorization: {
        params: {
          scope: `openid profile email offline_access api://${clientId}/access_as_user`,
          prompt: 'select_account',
          // Optional: route home-realm discovery to a specific tenant domain so
          // cached SSO accounts don't auto-resolve to their home tenant.
          ...(process.env.AZURE_AD_DOMAIN_HINT
            ? { domain_hint: process.env.AZURE_AD_DOMAIN_HINT }
            : {}),
        },
      },
      token: {
        params: {
          scope: `openid profile email offline_access api://${clientId}/access_as_user`,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
        // Store refresh token for Graph API photo proxy route
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token
        }
      }
      // Strip any stale base64 profile photo that was embedded in old JWTs
      // to prevent oversized cookies (HTTP 431).
      if (typeof token.picture === 'string' && token.picture.startsWith('data:')) {
        delete token.picture
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

/**
 * Wrapper around next-auth's getServerSession pre-bound to authOptions.
 * Use this in server components and API routes.
 */
export function getServerSession() {
  return nextGetServerSession(authOptions)
}
