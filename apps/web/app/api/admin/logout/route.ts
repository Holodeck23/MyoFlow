import { clearAdminTokenCookie } from '@/lib/admin-auth'

export async function POST() {
  try {
    // Clear the admin token cookie
    const response = clearAdminTokenCookie()

    console.log('Admin user logged out')

    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}