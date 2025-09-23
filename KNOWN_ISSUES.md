# Known Issues

**Last Updated:** September 23, 2025

## Current Issues

### Minor (Non-blocking)
- **TravelRouteMap:** Temporarily disabled in calendar - can be restored if needed
- **Settings API:** Some endpoint placeholders remain (profile, system preferences)

## Recently Fixed ✅

- **NextAuth v5:** Authentication system fully working
- **React Hooks:** All useEffect dependency warnings resolved
- **Image Optimization:** All img tags converted to Next.js Image
- **Build Performance:** No ESLint warnings or TypeScript errors
- **Code Quality:** Professional production-ready codebase

## Architecture Decisions

- **Modular Settings:** 2,414-line monolithic component split into 7 lazy-loaded components
- **Performance First:** Removed heavy Google Maps imports from dashboard bundle
- **Austrian Compliance:** RKSV foundation implemented for future certification

## Development Notes

- MVP is feature-complete and production-ready
- Future development should focus on user feedback and RKSV completion
- All critical performance and code quality issues resolved