"""Generate Play Store and App Store marketing icons from PWA icon generator."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ICONS = ROOT / "public" / "icons"
STORE_ASSETS = ROOT.parent / "store-assets"

# Reuse PWA generator
sys.path.insert(0, str(ROOT / "scripts"))
from generate_pwa_icons import make_icon  # noqa: E402


def main() -> None:
    icon_512 = PUBLIC_ICONS / "icon-512.png"
    if not icon_512.is_file():
        print("Run: npm run generate:icons first")
        sys.exit(1)

    STORE_ASSETS.mkdir(parents=True, exist_ok=True)
    shutil.copy(icon_512, STORE_ASSETS / "play-store-icon-512.png")
    make_icon(1024, STORE_ASSETS / "app-store-icon-1024.png")
    print(f"Wrote {STORE_ASSETS / 'play-store-icon-512.png'}")
    print(f"Wrote {STORE_ASSETS / 'app-store-icon-1024.png'}")


if __name__ == "__main__":
    main()
