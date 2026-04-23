# Mobile App Strategy (iOS + Android)

## One codebase, two apps

With React Native, a single codebase produces both the Android app (AAB /
APK for the Play Store) and the iOS app (IPA for the App Store). There is
no separate iOS project to maintain.

## Building iOS without a Mac

Apple requires macOS to compile iOS binaries. Two ways to handle this:

- **EAS Build** (Expo's cloud build service). One command —
  `eas build --platform ios` — builds the app on Expo's Macs and returns a
  downloadable IPA. Works from Windows, Linux, or Mac.
- **Rent a Mac in the cloud** (MacinCloud, MacStadium). Around USD 20–30
  per month.

**EAS Build is the recommended path.** It removes the biggest blocker for
non-Mac developers.

## Required accounts

| Account | Cost | Why |
|---------|------|-----|
| Apple Developer | USD 99 / year | Required to publish to the App Store |
| Google Play Developer | USD 25 one-time | Required to publish to the Play Store |
| Expo | Free tier is enough to start | Cloud builds, push notifications, updates |

## Launch order

**Launch Android first.** Over 80% of Nigerian smartphone users are on
Android, Play Store review is usually hours rather than days, and the
developer account fee is one-time. Add iOS one or two months after Android
is stable.
