# Code signing and auto-update

## Auto-update (done)

- `tauri-plugin-updater` reads `https://github.com/codepawl/deskfisch/releases/latest/download/latest.json`.
- Every release built by the workflow is signed with the update key. The **public** key is in `src-tauri/tauri.conf.json`; the **private** key lives in the repository secret `TAURI_SIGNING_PRIVATE_KEY` and in `~/.tauri/deskfisch.key` on the dev machine. Back that file up: losing it means no existing install can ever update again.
- The app checks 15 s after launch and from Settings → "Check for updates". Linux updates only apply to the AppImage; deb/rpm users update through their package manager.

## Apple (macOS): Developer ID + notarization

1. Join the Apple Developer Program ($99/year) at https://developer.apple.com/programs/.
2. In Xcode or the developer portal create a **Developer ID Application** certificate and install it in Keychain.
3. Export it as `.p12` with a password, then base64 it: `base64 -i cert.p12 | pbcopy`.
4. Create an **app-specific password** for your Apple ID at https://appleid.apple.com (Sign-In and Security → App-Specific Passwords).
5. Add repository secrets (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |---|---|
   | `APPLE_CERTIFICATE` | the base64 from step 3 |
   | `APPLE_CERTIFICATE_PASSWORD` | the .p12 export password |
   | `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` |
   | `APPLE_ID` | your Apple ID email |
   | `APPLE_PASSWORD` | the app-specific password |
   | `APPLE_TEAM_ID` | 10-character team id |

6. Tag a release. tauri-action signs and notarizes the dmg; Gatekeeper stops warning.

## Windows: Azure Trusted Signing

1. Create an Azure account and a **Trusted Signing** resource (Basic tier, about $10/month). Complete identity validation (individual or organization).
2. Create a certificate profile (Public Trust) and note the account name, profile name and endpoint.
3. Create an app registration (service principal) with the "Trusted Signing Certificate Profile Signer" role on the resource.
4. Add secrets `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`.
5. Add the sign command to `src-tauri/tauri.conf.json` once the profile exists:

   ```json
   "bundle": {
     "windows": {
       "signCommand": "sign code trusted-signing -tse https://<region>.codesigning.azure.net -tsa <account> -tscp <profile> %1"
     }
   }
   ```

   The workflow installs the `sign` CLI and exports the Azure variables only when `AZURE_CLIENT_ID` is set, so builds stay unsigned until then.

## Linux

No signing needed. AppImage users get auto-update; deb/rpm are plain packages.

## iOS (App Store)

The phone build is the same web app in a Tauri iOS shell (`src-tauri/tauri.ios.conf.json`
sets bundle id `com.codepawl.deskfisch` and the team). It is built and uploaded by
`.github/workflows/ios.yml`, since Xcode only runs on macOS.

1. App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys →
   Generate (role App Manager). Download the `.p8` once.
2. Repository secrets: `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`, `APPLE_API_KEY_P8` (base64 of the .p8).
3. App Store Connect → Apps → + → iOS app, bundle id `com.codepawl.deskfisch` (register it under
   Certificates, Identifiers & Profiles → Identifiers first if it is not offered).
4. Run the iOS workflow (Actions → iOS → Run workflow) or push an `ios-v*` tag. The build lands
   in TestFlight; fill in the store listing and submit for review from App Store Connect.
