# Fehlersuche

Diese Anleitung bietet Lösungen für häufige Probleme, die bei der Verwendung von MyoFlow auftreten können.

## Anmeldeprobleme

*   **"Anmelde-Button ist deaktiviert"**
    *   Dies kann passieren, wenn die Felder für E-Mail oder Passwort nicht korrekt ausgefüllt sind. Stellen Sie sicher, dass Sie eine gültige E-Mail-Adresse eingegeben haben und Ihr Passwort die Mindestanforderungen erfüllt.
*   **Passwortanforderungen**
    *   Ihr Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.
*   **Probleme mit Google OAuth**
    *   Wenn Sie Probleme bei der Anmeldung mit Google haben, stellen Sie sicher, dass Sie Cookies von Drittanbietern in Ihren Browsereinstellungen aktiviert haben.

## Rechnungsdatumsauswahl

*   **"Warum kann ich keine zukünftigen Daten auswählen?"**
    *   In Übereinstimmung mit den österreichischen Vorschriften können Rechnungen nur für bereits erbrachte Leistungen ausgestellt werden. Daher kann das Leistungsdatum für eine Rechnung nicht in der Zukunft liegen.
*   **Unterschiede im Datumsformat**
    *   MyoFlow zeigt Daten im für die ausgewählte Sprache geeigneten Format an (MM/TT/JJJJ für Englisch, TT.MM.JJJJ für Deutsch).

## Validierung der Klientenadresse

*   **Österreichische Postleitzahlen**
    *   MyoFlow validiert österreichische Postleitzahlen, um sicherzustellen, dass sie im korrekten Format vorliegen (eine vierstellige Zahl zwischen 1000 und 9999).
*   **Erforderliche Felder**
    *   Um die Adresse eines Klienten zu speichern, müssen Sie alle erforderlichen Felder ausfüllen: Straße, Postleitzahl, Stadt und Land.

## Profilvervollständigung

*   **"Mein Profil zeigt 0 % Fertigstellung, obwohl ich einige Felder ausgefüllt habe."**
    *   Das Widget zur Profilvervollständigung verfolgt eine bestimmte Reihe von erforderlichen Feldern. Um 100 % zu erreichen, müssen Sie alle folgenden Felder im Reiter "Einstellungen" > "Profil" ausfüllen:
        *   Firmenname
        *   Vollständige Geschäftsadresse
        *   Berufsbezeichnung
        *   Mehrwertsteuerstatus
