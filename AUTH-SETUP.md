# Login, roles na location scope (STEP 3) — intambwe zo gutegura

## Uko bikora
- Buri mukoresha afite profile muri Firestore: `users/{UID}` (role + district/sector/cell/village).
- Utagira profile ikora (`active: true`) ntabona data na imwe — nubwo yaba yiyandikishije muri Firebase Auth.
- Ibyo umukoresha abona bishingiye ku **rwego rwe rwo hasi**: umudugudu abona uwo mudugudu gusa; umurenge abona umurenge wose; akarere kabona akarere kose.
- Buri document ibika `district/sector/cell/village`; rules zirabihuza na profile.

| Role | Abona/Yandika | Ashobora gukora abakoresha |
|---|---|---|
| DISTRICT_ADMIN | Akarere kose (asoma+yandika+asiba) | Bose |
| ES_SECTOR | Umurenge we | SECTOR, CELL, VILLAGE, FIELD_OFFICER, VIEWER mu murenge we |
| SECTOR / CELL / VILLAGE / FIELD_OFFICER | Urwego rwe (asoma+yandika) | Oya |
| VIEWER | Urwego rwe, asoma gusa | Oya |

## Intambwe (ukurikize uko bikurikirana)

### 1. Kora umuyobozi wa mbere (rimwe gusa)
1. Firebase Console → Authentication → Users → Add user: `admin@girinka.local` + ijambobanga rikomeye. **Kopa UID**.
2. Firestore Database → Start collection `users` → Document ID = **UID** ya wa muntu → fields:
   - `fullName` (string), `username` (string, urugero `admin`)
   - `role` = `DISTRICT_ADMIN`
   - `district` = `Musanze`
   - `active` = `true` (**boolean**, si string)
   - (si ngombwa) `sector`, `cell`, `village` = null
3. Abakoresha b'Auth wari waratangiye gukora mbere bakeneye na bo profile bwo kimwe (UID yabo), cyangwa ubakore bundi bushya muri app (username nshya).

### 2. Shyiraho rules z'agateganyo (ku bw'iyimurwa ry'amakuru)
Firestore → Rules → koporora `firestore.rules.temp` → **Publish**.

### 3. Subiza amakuru ya kera (migration) — rimwe gusa
1. Shyiraho APK nshya, winjire nka DISTRICT_ADMIN.
2. Home → **Abakoresha** → hasi kanda **Gusana amakuru ya kera (migration)** → Yego.
3. Tegereza raporo (zahinduwe/zasibwe). Ushobora kubisubiramo nta cyo bitwaye.
> Niba ari umushinga mushya nta makuru ya kera, ushobora gusimbuka iyi ntambwe (ariko seed ya 814 ya Cyuve ikorwa ubwayo iyo DISTRICT_ADMIN yinjiye bwa mbere).

### 4. Shyiraho rules zisoza
Firestore → Rules → koporora `firestore.rules` → **Publish**. Kuva ubu buri wese abona urwego rwe gusa.

### 5. Kora abandi bakoresha
Home → Abakoresha → **+ Umukoresha mushya** → amazina, username, ijambobanga rya mbere, role, aho akorera. Umukoresha yinjira yandika username gusa (app yongeraho `@girinka.local`). Ashobora guhindura ijambobanga kuri Home → *Guhindura ijambobanga*.
Guhagarika umukoresha: Abakoresha → zimya switch ye.

### 6. Gerageza (Rules Playground / app)
Injira nka VILLAGE user: ugomba kubona abagenerwabikorwa b'umudugudu we gusa; VIEWER ntabone buto z'ubwiyandikisha.

## Ibyitonderwa
- **Ijambobanga rwibagiranye**: emails ni iza `@girinka.local` (ntizakira email). Umuyobozi asibe konti muri Firebase Console (Authentication), maze ayikore bundi bushya muri app na username nshya; profile ya kera ayizimye muri app.
- Ugomba kureka "sign-up" ifunguye muri Firebase Authentication (app ikoresha uburyo bwo gukora konti mu izina ry'umuyobozi). Ntacyo bibangamira: utagira profile ikora ntabona data.
- Rules ntizirageragezwa kuri emulator: nyuma yo kuzishyiraho, gerageza nka VILLAGE, ES_SECTOR na VIEWER mbere yo kuzikoresha n'abandi.
- Buri gufungura urutonde rw'abagenerwabikorwa risoma abo mu rwego rwawe (cache y'iminota 5); umuyobozi w'akarere asoma 814 — bibarwa muri quota ya Firestore ya buri munsi (50k).
- Guhindura domain ya email: `AUTH_EMAIL_DOMAIN` muri `src/config/firebase.ts`.
