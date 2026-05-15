"""Generate PWA icons and Open Graph image (stdlib + Pillow)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _rounded_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill: str,
) -> None:
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def make_icon(size: int, out_path: Path) -> None:
    img = Image.new("RGB", (size, size), "#000000")
    draw = ImageDraw.Draw(img)
    radius = max(8, size // 8)
    _rounded_rect(draw, (0, 0, size - 1, size - 1), radius, "#000000")

    cx, cy = size // 2, int(size * 0.32)
    cr = max(4, int(size * 0.06))
    draw.ellipse((cx - cr, cy - cr, cx + cr, cy + cr), fill="#a3e635")

    font = _font(max(12, int(size * 0.48)), bold=True)
    draw.text((cx, int(size * 0.78)), "A", fill="#ffffff", font=font, anchor="mm")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, format="PNG", optimize=True)


def make_og(out_path: Path) -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), "#0a0a0a")
    draw = ImageDraw.Draw(img)

    # Logo block
    _rounded_rect(draw, (80, 140, 260, 320), 28, "#000000")
    draw.ellipse((148, 168, 192, 212), fill="#a3e635")
    logo_font = _font(72, bold=True)
    draw.text((170, 285), "A", fill="#ffffff", font=logo_font, anchor="mm")

    title = _font(64, bold=True)
    subtitle = _font(32, bold=True)
    body = _font(26)

    draw.text((300, 200), "ActiveHQ", fill="#ffffff", font=title)
    draw.text((300, 270), "Gym OS + AI Coach for India", fill="#a3e635", font=subtitle)
    draw.text(
        (300, 340),
        "Members · Payments · Attendance · WhatsApp reminders",
        fill="#a3a3a3",
        font=body,
    )
    draw.text(
        (300, 390),
        "Free AI workout + diet plans at activehq.fit/coach",
        fill="#a3a3a3",
        font=body,
    )
    draw.text((60, 580), "activehq.fit", fill="#525252", font=_font(22))

    img.save(out_path, format="PNG", optimize=True)


def main() -> None:
    make_icon(192, ICONS / "icon-192.png")
    make_icon(512, ICONS / "icon-512.png")
    make_og(PUBLIC / "og-image.png")
    print("Wrote icon-192.png, icon-512.png, og-image.png")


if __name__ == "__main__":
    main()
