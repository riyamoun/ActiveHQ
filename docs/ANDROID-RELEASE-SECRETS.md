# Android release workflow secrets

For `.github/workflows/android-release.yml`, add these repository secrets:

| Secret | Example | Required |
|--------|---------|----------|
| `ANDROID_KEYSTORE_BASE64` | Base64 of `activehq-upload.jks` | Yes |
| `ANDROID_KEYSTORE_PASSWORD` | `your-store-password` | Yes |
| `ANDROID_KEY_ALIAS` | `activehq` | Yes |
| `ANDROID_KEY_PASSWORD` | `your-key-password` | Yes |
| `VITE_API_URL` | `https://activehq-api.onrender.com` | Yes |
| `VITE_APP_URL` | `https://activehq.fit` | Yes |

## Generate `ANDROID_KEYSTORE_BASE64`

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("frontend/android/activehq-upload.jks")) | Set-Clipboard
```

Paste the clipboard value into GitHub → Settings → Secrets and variables → Actions.

## Trigger a release build

```bash
git tag v1.0.1
git push origin v1.0.1
```

Workflow output:

- Artifact: `activehq-aab-v1.0.1`
- Release asset on tag `v1.0.1`: `app-release.aab`
