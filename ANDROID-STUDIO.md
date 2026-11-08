# GirinkaApp — Gukora APK muri Android Studio

## Ibyo ukeneye kuri mudasobwa (rimwe gusa)
1. Node.js 18 cyangwa 20 LTS
2. JDK 17 (Android Studio ije na JBR 17 — bihagije)
3. Android Studio (Hedgehog cyangwa nshya) + SDK Platform 34 + Build-Tools 34.0.0 + NDK/CMake (SDK Manager -> SDK Tools)
4. Shyiraho ANDROID_HOME (urugero C:\Users\<izina>\AppData\Local\Android\Sdk)

## Intambwe
1. Muri terminal, mu bubiko bw'umushinga:  `npm install`
2. Reba ko `.env` ihari (Firebase + Cloudinary) — ni yo ishyirwa muri APK.
3. Fungura Android Studio -> Open -> hitamo ububiko **girinka-app/android** (ntabwo ari girinka-app).
4. Tegereza Gradle Sync irangire.
5. DEBUG APK:  Build -> Build Bundle(s)/APK(s) -> Build APK(s)
   cyangwa `cd android && gradlew.bat assembleDebug`
   Iboneka: android/app/build/outputs/apk/debug/app-debug.apk
6. RELEASE APK:  `cd android && gradlew.bat assembleRelease`
   Iboneka: android/app/build/outputs/apk/release/app-release.apk

## Niba wahinduye app.json cyangwa wongeyemo native package
`npm run prebuild`   (isubiramo gukora ububiko bwa android)

## Release ifite signature yawe (mbere yo gushyira kuri Play Store)
keytool -genkeypair -v -storetype PKCS12 -keystore girinka-release.keystore -alias girinka -keyalg RSA -keysize 2048 -validity 10000
Shyira .keystore muri android/app/, hanyuma muri android/gradle.properties:
GIRINKA_STORE_FILE=girinka-release.keystore
GIRINKA_STORE_PASSWORD=****
GIRINKA_KEY_ALIAS=girinka
GIRINKA_KEY_PASSWORD=****
maze muri android/app/build.gradle ukoreshe signingConfigs.release ibi bitagaragara (ubu release ikoresha debug keystore — irakora gusangira APK, ariko si iya Play Store).
Ntugatakaze .keystore!
