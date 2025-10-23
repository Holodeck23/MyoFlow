# Troubleshooting

This guide provides solutions to common issues you may encounter while using MyoFlow.

## Login Issues

*   **"Sign in button is disabled"**
    *   This can happen if the email or password fields are not filled out correctly. Ensure you have entered a valid email and that your password meets the minimum requirements.
*   **Password Requirements**
    *   Your password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.
*   **Google OAuth Issues**
    *   If you are having trouble signing in with Google, ensure that you have enabled third-party cookies in your browser settings.

## Invoice Date Picker

*   **"Why can't I select future dates?"**
    *   In compliance with Austrian regulations, invoices can only be issued for services that have already been rendered. Therefore, the service date for an invoice cannot be in the future.
*   **Date Format Differences**
    *   MyoFlow displays dates in the format appropriate for the selected language (MM/DD/YYYY for English, DD.MM.YYYY for German).

## Client Address Validation

*   **Austrian Postal Codes**
    *   MyoFlow validates Austrian postal codes to ensure they are in the correct format (a four-digit number between 1000 and 9999).
*   **Required Fields**
    *   To save a client's address, you must fill out all required fields: street, postal code, city, and country.

## Profile Completion

*   **"My profile shows 0% completion, but I have filled in some fields."**
    *   The profile completion widget tracks a specific set of required fields. To reach 100% completion, you must fill out all of the following in the "Settings" > "Profile" tab:
        *   Business Name
        *   Full Business Address
        *   Professional Designation
        *   VAT Status
