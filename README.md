# Holy Five

Prototyp strony Holy Five — grupy znajomych z 221 grających razem w CS2 na FACEIT. Projekt nie reprezentuje profesjonalnej organizacji esportowej.

**Strona online:** [n3xus47.github.io/holyfive](https://n3xus47.github.io/holyfive/)

## Zawartość

- **Strona główna** — prezentacja ekipy, slajdy z modelami 3D, animowane tło reagujące na kursor i karty „Bóg”, „Honor”, „Ojczyzna”. Logotypy firm są dekoracyjne i nie oznaczają współpracy.
- **Zawodnicy** — skład, rezerwa, profile i statystyki FACEIT. Kliknięcie karty otwiera profil gracza.
- **Akademia** — zasady wspólnej gry, mapy Nuke, Ancient i Dust 2 oraz narzędzia do rysowania na mapach. Materiały nie stanowią kompletnego poradnika taktycznego.

Podstrony korzystają ze wspólnego nagłówka i stopki. Podpis Holy Five odtwarza się po pojawieniu się w widoku i pozostaje widoczny po zakończeniu animacji.

## Technologia i wymagania

Statyczna strona HTML, CSS i JavaScript budowana przez Vite. Three.js obsługuje modele 3D. Część bibliotek i fontów pochodzi z CDN, m.in. GSAP, ScrollTrigger, Lenis i biblioteka szumu Perlin. Statystyki są pobierane bezpośrednio z API FACEIT. Projekt nie ma własnego backendu ani bazy danych.

- Node.js 24 i pnpm 11.25.0 — wersje używane podczas publikacji.
- Git i Git LFS — pliki `.mp4` i `.glb` są przechowywane w LFS.
- Internet do instalacji, bibliotek z CDN i danych FACEIT.

## Uruchomienie lokalne

```sh
git clone https://github.com/n3xus47/holyfive.git
cd holyfive
git lfs install
git lfs pull
pnpm install --frozen-lockfile
pnpm run dev
```

Otwórz adres podany przez Vite, domyślnie `http://localhost:5173/`. Adres `/` przekierowuje na stronę główną. Nie otwieraj HTML bezpośrednio z dysku — moduły i wspólne fragmenty wymagają serwera HTTP.

| Widok | Ścieżka lokalna |
| --- | --- |
| Główna | `/pages/views/holyfive/holyfive.html` |
| Zawodnicy | `/pages/views/holyfive/zawodnicy.html` |
| Akademia | `/pages/views/holyfive/akademia.html` |

## Budowanie

```sh
pnpm run build
pnpm run preview
```

Wynik trafia do `dist/`. Konfiguracja Vite buduje trzy podstrony i wejście przekierowujące. Kopiuje też zasoby pobierane podczas działania strony: fragmenty HTML, modele, tekstury i nagrania.

Domyślnie build działa pod `/`. Zmienna `PAGES_BASE` ustawia prefiks hostingu w podkatalogu. Przykład GitHub Pages w PowerShell:

```powershell
$env:PAGES_BASE = '/holyfive/'
pnpm run build
pnpm run preview
Remove-Item Env:PAGES_BASE
```

W bash:

```sh
PAGES_BASE=/holyfive/ pnpm run build
PAGES_BASE=/holyfive/ pnpm run preview
```

## Publikacja przez GitHub Pages

Workflow `.github/workflows/pages.yml` uruchamia się po wysłaniu zmian na `main` lub ręcznie przez GitHub Actions. Pobiera pliki LFS, instaluje pakiety zgodnie z `pnpm-lock.yaml`, buduje z `PAGES_BASE=/holyfive/` i publikuje `dist/`.

```sh
git add <zmienione-pliki>
git commit -m "Opis zmiany"
git push origin main
```

Postęp: [GitHub Actions](https://github.com/n3xus47/holyfive/actions). W ustawieniach repozytorium **Pages → Source** musi być wybrane **GitHub Actions**. Strona nie wymaga uruchomionego komputera autora.

## Struktura i edycja

| Miejsce | Zawartość |
| --- | --- |
| `src/index.html` | Przekierowanie na stronę główną |
| `src/pages/views/holyfive/` | Podstrony i multimedia |
| `src/pages/views/holyfive/partials/` | Wspólny nagłówek i stopka |
| `src/pages/views/holyfive/include.js` | Wczytywanie wspólnych fragmentów |
| `src/features/holyfive/` | Style i logika poszczególnych widoków |
| `src/shared/css/header.css` | Wspólny wygląd nagłówka |
| `src/shared/css/view-transition.css` | Przejścia między dokumentami |
| `src/shared/lib/canvas-lifecycle.js` | Cykl działania animacji canvas |
| `vite.config.js` | Wejścia, budowanie i ścieżki publikacji |

Teksty strony głównej są częściowo w HTML, a częściowo w obiekcie `translations` w `holyfive.js`. Sprawdzaj oba miejsca: skrypt może nadpisać tekst HTML. Zawartość okien Akademii znajduje się w `akademia.js`. Edytuj źródła w `src/`, nie wynik w `dist/`.

## Sprawdzanie zmian

Projekt nie ma skonfigurowanego zestawu testów automatycznych. Przed publikacją uruchom `pnpm run build`, a następnie sprawdź:

1. Trzy podstrony w podglądzie, również z prefiksem `/holyfive/`.
2. Konsolę i żądania sieciowe, zdjęcia, modele i filmy.
3. Wspólny header, nawigację i układ na komputerze oraz telefonie.
4. Odnośniki i statystyki FACEIT, animowane tło i jednorazowy podpis w stopce.

## Ograniczenia

- Fonty, część animacji i statystyki zależą od zewnętrznych usług i dostępu do internetu.
- Wideo strony głównej jest duże; pierwsze ładowanie może potrwać na wolnym łączu.
- Konfiguracja FACEIT znajduje się w publicznym kodzie przeglądarki. Sekretnego klucza nie da się ukryć w statycznej stronie ani zmiennej dodanej do buildu. Docelowo żądania wymagające sekretu powinien obsługiwać backend; obecny klucz wymaga przeglądu i wymiany.
- Zdjęcia, modele, fonty i znaki marek mogą podlegać osobnym licencjom. Obecność w repozytorium nie stanowi licencji na dalsze wykorzystanie; zachowuj dołączone informacje licencyjne.
