# Praca nad Holy Five

Holy Five to grupa znajomych grających w CS2 na FACEIT. Pisz krótko i konkretnie, bez tonu profesjonalnej organizacji esportowej. Projekt działa samodzielnie; nie zakładaj dostępu do dawnego monorepo 221 ani ścieżek `/home/n3xus/`.

- Uruchamianie, strukturę i publikację opisuje `README.md`.
- Edytuj źródła w `src/`, nie wygenerowany `dist/`.
- Nagłówek i stopka są wspólne: `src/pages/views/holyfive/partials/`. Nagłówek styluje `src/shared/css/header.css`; nie twórz osobnych wersji dla podstron.
- Teksty `data-i18n` mogą być nadpisywane przez `translations` w `holyfive.js`. Aktualizuj je razem z HTML.
- Opisy i zasady w oknach Akademii znajdują się w `akademia.js`.
- Nie przywracaj importów nieobecnych modułów dawnego projektu 221.
- Używaj Node.js 24 i pnpm 11.25.0. Zachowuj spójność `package.json` i `pnpm-lock.yaml`.
- Po zmianach działania lub publikacji uruchom `pnpm run build` i sprawdź odpowiednie widoki w przeglądarce, również z `PAGES_BASE=/holyfive/`.
- Sprawdzaj układ mobilny, wspólny header, linki FACEIT i błędy zasobów.
- Filmy i modele wymagają Git LFS. Nie zastępuj ich przypadkowo wskaźnikami LFS.
- Nie dodawaj sekretów do kodu przeglądarki, dokumentacji ani logów.

Każdy push na `main` uruchamia `.github/workflows/pages.yml` i aktualizuje publiczną stronę.
