# 🔐 Testing Email Authentication

**Day 1 authentication is complete - let's test it!**

## Quick Setup

### 1. Copy environment file
```bash
cp .env.example .env
```

### 2. Add Gmail settings to `.env`
Open `.env` file and update these lines:

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=cloudcoverpublishing@gmail.com
EMAIL_SERVER_PASSWORD=Holodeck666
EMAIL_FROM=MyoFlow <cloudcoverpublishing@gmail.com>
NEXTAUTH_SECRET=any-random-string-for-development
NEXTAUTH_URL=http://localhost:3000
```

**Note:** Use a Gmail account without 2FA for testing.

### 3. Start the development server
```bash
pnpm dev
```

### 4. Test the authentication flow
1. Visit http://localhost:3000
2. Click "Sign In"
3. Enter your email address
4. Click "Sign in with Email"
5. Check your Gmail for the magic link
6. Click the link to sign in
7. You should land on the dashboard!

## What to expect

- **Sign-in page:** Clean form with loading states
- **Email sent:** "Check your email for a sign-in link!" message
- **Magic link:** Gmail should receive a sign-in link
- **Dashboard:** Protected page showing your email address
- **Navigation:** Home page shows "Go to Dashboard" when signed in

## If something breaks

- Check console for errors
- Verify Gmail credentials in `.env`
- Make sure Gmail account doesn't have 2FA
- Try a different Gmail account

**Success = Full authentication flow working!**
**Ready for Day 2: Session middleware and user onboarding**