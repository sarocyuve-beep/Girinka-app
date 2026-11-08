# GirinkaApp — Prototype (Expo / React Native)

Uyu ni umushinga wa mbere (scaffold) wa GirinkaApp, wubatswe muri **Expo + TypeScript**
kugira ngo ushobore kwipima vuba muri **Expo Go** ukoresheje **VS Code**, mbere yo
kuwushyira muri Android Studio nk'uko byari byateganyijwe muri roadmap.

## Icyakozwe kugeza ubu

- Project structure (Expo + TypeScript + React Navigation)
- **Database: Firebase Firestore** (yasimbuye SQLite — mu gihe cy'igerageza,
  kubera ko Firestore na Cloudinary bifite free tier ihagije kuri pilot)
- **Photo/document storage: Cloudinary** (free tier — izakoreshwa kuri
  amafoto y'inka, ibyangombwa by'abagenerwabikorwa, n'ibindi)
- Module ya **Selection** ikora by'ukuri (yimuriwe kuri Firestore):
  - Gushyiraho gahunda yo gutoranya (Selection Campaign)
  - Kwandika abakandida (Candidates)
  - Eligibility checklist (checkbox 8 kuri buri mukandida)
- Module ya **Beneficiary Registry** (nshya):
  - Yuzuye na register y'abagenerwabikorwa 814 ba Girinka bo mu Murenge wa
    **Cyuve** (Akarere ka Musanze), ivuye kuri raporo ya Auditor General
  - Ishakisha (search) hamwe na buri muntu, hamwe n'amateka y'inka yahawe
    (distribution history: umwaka, inkomoko, niba yitura)
  - Iyinjizwa (seed import) ikorwa nta kabuza igihe app itangiye bwa mbere
    (`importCyuveBeneficiariesIfNeeded` muri `src/db/registryRepository.ts`)
- Ibisobanuro bibiri: Ikinyarwanda / Icyongereza (`src/i18n/strings.ts`)

## Ibitegura ku mudugudu wawe (mbere yo gutangira)

Ukeneye:
1. **Node.js** (18 cyangwa 20 LTS) — https://nodejs.org
2. **VS Code** — https://code.visualstudio.com
3. Terefone/telefone ifite **Expo Go** app (kuri Play Store cyangwa App Store)
4. Konti ya **Firebase** (free "Spark" plan) — https://console.firebase.google.com
5. Konti ya **Cloudinary** (free plan) — https://cloudinary.com/users/register/free

## 1. Gutegura Firebase (Firestore) — free, mu gihe cy'igerageza

1. Injira kuri https://console.firebase.google.com → **Add project** →
   ha izina (urugero: `girinka-cyuve`) → kurikiza intambwe, ntukeneye
   Google Analytics kuri iki gerageza.
2. Muri project yawe: **Build → Firestore Database → Create database**.
   Hitamo **"Start in test mode"** kugira ngo ubashe gukora ibigeragezo
   vuba (tuzashyiraho security rules nyakuri mbere yo gushyira app mu
   bikorwa by'ukuri — test mode ifite igihe kigenwe (30 days) mbere yo
   guhagarara, uzabe wibutse kubisubiramo cyangwa gushyiraho rules).
3. **Project settings** (icyuma cy'imashini iri hejuru y'ibumoso) →
   **General** → shirira hasi kuri "Your apps" → **Add app → Web (`</>`)**
   → ha izina, ntukeneye Firebase Hosting.
4. Firebase izaguha `firebaseConfig` object ifite `apiKey`, `authDomain`,
   `projectId`, n'ibindi. Fata ayo makuru uyashyire mu idosiye `.env` mu
   mizi y'umushinga (reba "Environment variables" hepfo).

## 2. Gutegura Cloudinary — free, mu gihe cy'igerageza

1. Iyandikishe kuri https://cloudinary.com/users/register/free
2. Kuri Dashboard yawe, fata **Cloud name** (iri hejuru cyane).
3. **Settings → Upload → Upload presets → Add upload preset**:
   - Signing Mode: **Unsigned** (ni ngombwa kugira ngo app ishobore kohereza
     amafoto ntacyo isabwe kiri "secret" — niko bikorwa kuri apps za mobile)
   - Ha izina (urugero: `girinka_unsigned`) uzabikoresha mu `.env`
4. (Si ngombwa ubu) Wanashyiraho folder itandukanye kuri buri module
   (cows/, beneficiaries/, documents/) kugira ngo amafoto agenda ahantu
   hemewe.

## 3. Environment variables

Kora idosiye `.env` mu mizi y'umushinga (`girinka-app/.env`, ntuyishyire
kuri git — reba `.gitignore`) ifite:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=girinka_unsigned
```

Expo SDK 51 isoma automatiquement environment variables zitangira na
`EXPO_PUBLIC_` (nta package indi ukeneye kongeraho). Nyuma yo guhindura
`.env`, hagarika `npx expo start` maze uyitangire bundi bushya.

## Uko wo gutangiza (VS Code + Expo Go)

```bash
# 1. Injira mu bubiko
cd girinka-app

# 2. Shyiramo dependencies
npm install

# 3. Tangiza Expo dev server
npx expo start
```

Nyuma yo gukanda `npx expo start`, hazagaragara **QR code** kuri terminal cyangwa
kuri browser (Metro Bundler). Fungura **Expo Go** kuri telefone yawe, ukande
"Scan QR Code", maze ubone GirinkaApp ikora aho aho kuri telefone yawe.

Igihe cya mbere app itangiye (niba Firebase yateguwe neza), izikuza
automatiquement register y'abagenerwabikorwa 814 ba Cyuve muri Firestore
(bimara amasegonda make — reba banner itukura hasi niba hari ikosa,
urugero niba `.env` itariteguwe neza).

> Niba ukoresha emulator ya Android muri Android Studio, ushobora no gukanda `a`
> muri terminal (nyuma yo gutangiza `npx expo start`) kugira ngo ifungurire kuri
> emulator aho kuba kuri telefone nyayo.

## Uko byubatswe (folder structure)

```
girinka-app/
  App.tsx                        <- entry point, ikora seed import + navigation
  .env                           <- Firebase & Cloudinary keys (ntabwo iri kuri git)
  src/
    config/
      firebase.ts                <- Firestore init + collection names
      cloudinary.ts              <- unsigned upload helper (photos/documents)
    db/
      selectionRepository.ts     <- CRUD ya Selection module (Firestore)
      registryRepository.ts      <- CRUD + seed import ya Beneficiary Registry
    types/
      selection.ts                <- types za Candidate, EligibilityChecklist, n'ibindi
      registry.ts                 <- types za Beneficiary, Distribution
      core.ts                      <- roles, users, location scope
    navigation/
      RootNavigator.tsx
    screens/
      HomeScreen.tsx
      selection/
        SelectionCampaignListScreen.tsx
        SelectionCampaignFormScreen.tsx
        CandidateListScreen.tsx
        CandidateFormScreen.tsx
        CandidateDetailScreen.tsx
      registry/
        BeneficiaryListScreen.tsx    <- search + list
        BeneficiaryDetailScreen.tsx  <- info + distribution history
    i18n/
      strings.ts
    data/
      musanzeLocations.json        <- Sector->Cell->Village ya Musanze (432 imidugudu)
      locations.ts                 <- helper zo gusoma iyo tree (static, ntabwo bijya kuri Firestore)
      cyuveBeneficiaries.json      <- register y'abagenerwabikorwa 814 ba Cyuve (source data)
```

## Icyitonderwa ku bijyanye na Firestore free tier

Firestore (Spark/free plan) igufasha rwose kuri pilot imwe:
50,000 reads + 20,000 writes + 1 GiB storage buri munsi. Ibi bihagije
cyane kuri Murenge umwe cyangwa bike. Niba hazaza andi Marenge menshi
(Akarere kose cyangwa Igihugu), tuzasaba **Blaze plan** (pay-as-you-go —
ifite na yo free quota imwe, wishyura gusa ibirenga), kandi tuzashyiraho
composite indexes Firestore izasaba (izaguha link yo kuyikora ubwo
uzabona ikosa "requires an index" mu mafunguro ya buri page ari nini).

## Ibikurikira (dukurikije roadmap yawe)

- Security rules nyakuri kuri Firestore (test mode isaba kongera igihe
  cyangwa gushyiraho rules mbere y'iminsi 30)
- STEP 3: Login, users na roles (DISTRICT_ADMIN, ES_SECTOR, SECTOR, CELL,
  VILLAGE, FIELD_OFFICER, VIEWER) + Firebase Authentication + location-based
  data visibility
- STEP 4: Location pickers (District -> Sector -> Cell -> Village) bakoresheje
  `src/data/locations.ts` (ubu iracyari free-text fields muri Selection forms)
- Animal module + photo upload (expo-image-picker -> uploadToCloudinary)
- Guhuza Candidate -> Beneficiary (igihe candidate yemejwe akaba yarahawe inka,
  yinjizwa muri Beneficiary Registry na Distribution nshya)
- Kongeramo andi Marenge (sectors) muri Beneficiary Registry, atari Cyuve gusa
- STEP 8+: Follow-up, Health, Breeding, Production, Kwitura, Incidents,
  Penalties, Dashboard/Reports
- STEP 14: SMS reminders (kwitura due dates)
