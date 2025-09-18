# Translation Sweep Report – September 18, 2025

All findings were reviewed across `apps/web/app` and `apps/web/src/components/ui`. Each entry includes the path and line number, the hard-coded string, and suggested action.

## apps/web/app

1. `apps/web/app/dashboard/layout.tsx:52` – "MyoFlow Praxis" / "Österreichische Therapie-Verwaltung" (header titles). These should move to `t('dashboard.header.title')` / `t('dashboard.header.subtitle')`.
2. `apps/web/app/dashboard/page.tsx:23` – "Willkommen zurück" etc. Use `t` wrapper; ensure default translation entries exist.
3. `apps/web/app/dashboard/appointments/page.tsx:18` – "Weiterleitung zum Kalender..." default string is German fallback. Provide translation key and English fallback.
4. `apps/web/app/dashboard/calendar/page.tsx` – numerous German labels (e.g., "Terminübersicht", "Keine Termine"). All require translation keys. Several hard-coded emoji labels; consider translation with fallback.
5. `apps/web/app/dashboard/settings/page.tsx:40` – "Settings functionality is being developed..." placeholder text should use translation key.
6. `apps/web/app/dashboard/calendar/page.tsx` – dynamic strings for travel timeline ("Keine Hausbesuche heute", etc.) need translation keys.
7. `apps/web/app/components/Sidebar.tsx:73` – navigation labels like "Dashboard", "Kalender", "Einstellungen" should route through i18n.
8. `apps/web/app/components/Sidebar.tsx` – badge text "Neu" hardcoded.
9. `apps/web/app/components/RootContent.tsx:23` – "Navigation" heading in skip link needs translation.
10. `apps/web/app/components/CSVExportManager.tsx:44` – multiple English descriptions, plus headings. Wrap with translations.
11. `apps/web/app/components/CSVExportManager.tsx:124` – button text "Export BMD" etc. Localize.
12. `apps/web/app/components/ServiceRateManager.tsx` – entire component uses English strings ("Service Rate Templates", "Create Template"). Requires translation.
13. `apps/web/app/components/LoadingSpinner.tsx` – default message "Loading..." should be translation-based.
14. `apps/web/app/components/DashboardNav.tsx` – text like "Dashboard" etc. should use translation key.
15. `apps/web/app/components/RootContent.tsx:53` – Footer copy ("Impressum", "Datenschutz") should be translation keys.
16. `apps/web/app/dashboard/calendar/page.tsx` – analytics summary block ("Enhanced Calendar View - September 17, 2025") includes promotional copy needing translation.
17. `apps/web/app/dashboard/calendar/page.tsx` – quick indicator legends ("Hausbesuch", "Mit Anfahrt"). Add translation entries.
18. `apps/web/app/dashboard/calendar/page.tsx` – route statistics ("Gesamtstrecke", etc.) require localization.

## apps/web/src/components/ui

1. `apps/web/src/components/ui/Calendar.tsx` – default button text "Termin anlegen" etc. (check Day cell actions) – ensure `t` usage.
2. `apps/web/src/components/ui/Calendar.tsx` – month/day names derived from `date-fns` locale; verify fallback handling for English.
3. `apps/web/src/components/ui/TravelRouteMap.tsx` – titles like "Tagesroute", "Keine Hausbesuche heute" require translation keys.
4. `apps/web/src/components/ui/VisualRouteMap.tsx` – numerous German strings ("Heute", "Heimfahrt", etc.). Wrap with `t`.
5. `apps/web/src/components/ui/Calendar.tsx` – tooltips such as "Konflikt" and "Hausbesuch" need translation.
6. `apps/web/src/components/ui/VisualRouteMap.tsx` – status panel text ("Geplante Termine", etc.) requires translation.
7. `apps/web/src/components/ui/VisualRouteMap.tsx` – Quick Stats ("Durchschnittliche Fahrtzeit"). Use translation keys.
8. `apps/web/src/components/ui/VisualRouteMap.tsx` – CTA buttons ("Route aktualisieren", "CSV exportieren") need translation wrappers.
9. `apps/web/src/components/ui/index.ts` – ensure re-exported components expose translation props where needed.

## Recommendations

- Create `apps/web/src/i18n/dashboard.json` (or similar) to house new keys.
- Work through components one by one, wrapping strings with `t('key', 'fallback')` where appropriate.
- Coordinate with Claude on UI changes to avoid stepping on their branch.
- After updates, rerun `pnpm lint` and `pnpm test:run` to ensure no regressions.

