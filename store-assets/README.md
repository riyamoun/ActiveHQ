# Store listing assets

Generate base icons from `frontend/`:

```bash
cd frontend
npm run generate:icons
npm run generate:store-icons
```

## Required files

| Asset | Size | Used for |
|-------|------|----------|
| `play-store-icon-512.png` | 512×512 | Google Play high-res icon |
| `app-store-icon-1024.png` | 1024×1024 | Apple App Store icon (no alpha) |
| Phone screenshots | 1080×1920 or 1290×2796 | Both stores (min 2) |
| Feature graphic | 1024×500 | Google Play only |

## Screenshot ideas (capture from production or staging)

1. Dashboard with action center
2. Members list
3. Member detail + Device User ID
4. Payments / daily collection
5. Import Data wizard
6. Member portal login (optional second audience)

## Android adaptive icon

After `npm run mobile:sync`, replace mipmaps in:

`frontend/android/app/src/main/res/`

Use Android Studio **Image Asset** wizard with `app-store-icon-1024.png` or `icons/icon-512.png`.

## iOS icon

Xcode → Assets.xcassets → AppIcon — drag `app-store-icon-1024.png` into all slots (or use single 1024 source).
