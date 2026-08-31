# Training APP

Dziennik siłowy na 4-dniowy split. Zapisujesz ciężar i powtórzenia, dokładasz albo odejmujesz serie w locie, a po treningu aplikacja pokazuje progres względem poprzedniego razu tego samego dnia planu.

## Plan

- **Dzień 1** — klata + brzuch
- **Dzień 2** — plecy
- **Dzień 3** — nogi + brzuch
- **Dzień 4** — full body (te same ruchy, inna objętość)

Każde ćwiczenie ma własne serie z ciężarem (kg) i liczbą powtórzeń. Ćwiczenie można zmienić ręcznie — od tej chwili jego statystyki liczą się od zera, a stary ruch zostaje w historii pod poprzednią nazwą.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja wstaje na [http://127.0.0.1:43127](http://127.0.0.1:43127).

Bez konfiguracji Netlify dane lądują w `.data/app-state.json` (git ignoruje ten katalog). Na Netlify ten sam kod pisze do **Netlify Blobs**.

## Netlify Blobs

Po wrzuceniu na Netlify magazyn blobów działa sam: funkcje serwera dostają kontekst i zapisują stan w store `training-app` pod kluczem `app-state`.

Żeby lokalnie pisać do blobów konkretnej strony (zamiast pliku):

1. Skopiuj `.env.example` do `.env.local`
2. Uzupełnij `NETLIFY_SITE_ID` i `NETLIFY_AUTH_TOKEN` (personal access token z uprawnieniem do site)
3. Uruchom `npm run dev`

Albo użyj `netlify dev` po `netlify link` — CLI podstawia kontekst blobów.

Deploy:

```bash
npm run build
```

`netlify.toml` ustawia `@netlify/plugin-nextjs`.

## Motyw

Przełącznik słońce / księżyc w nagłówku. Domyślnie ciemny, z obsługą motywu systemowego. Logo jest czarne na jasnym tle i odwraca się na białe w trybie ciemnym.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Netlify Blobs.
