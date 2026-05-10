from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageColor, ImageDraw


REPO_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = REPO_ROOT / "frontend/public"
SOURCE_ICON = PUBLIC_DIR / "android-chrome-512x512.png"

BG_COLOR = ImageColor.getrgb("#0f172a")
MASKABLE_BG_COLOR = ImageColor.getrgb("#111827")
RADIUS_RATIO = 0.22
STANDARD_MARK_RATIO = 0.72
MASKABLE_MARK_RATIO = 0.62
SAFE_PADDING_RATIO = 0.12
BG_REMOVE_THRESHOLD = 18


def load_mark(path: Path) -> Image.Image:
    with Image.open(path).convert("RGBA") as image:
        alpha = image.getchannel("A")
        bbox = alpha.getbbox()
        if bbox and bbox != (0, 0, image.width, image.height):
            return image.crop(bbox)

        # If the source is already a full-canvas branded tile, strip the
        # known background color back out so reruns remain stable.
        extracted = image.copy()
        pixels = extracted.load()
        for y in range(extracted.height):
            for x in range(extracted.width):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                if (
                    abs(r - BG_COLOR[0]) <= BG_REMOVE_THRESHOLD
                    and abs(g - BG_COLOR[1]) <= BG_REMOVE_THRESHOLD
                    and abs(b - BG_COLOR[2]) <= BG_REMOVE_THRESHOLD
                ):
                    pixels[x, y] = (r, g, b, 0)

        extracted_alpha = extracted.getchannel("A")
        extracted_bbox = extracted_alpha.getbbox()
        if not extracted_bbox:
            raise ValueError(f"source icon has no visible pixels after background removal: {path}")
        return extracted.crop(extracted_bbox)


def rounded_rect_mask(size: int, radius_ratio: float) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def compose_icon(mark: Image.Image, size: int, mark_ratio: float, background: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*background, 255))
    mask = rounded_rect_mask(size, RADIUS_RATIO)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.alpha_composite(canvas)
    rounded.putalpha(mask)

    max_box = int(size * mark_ratio)
    fitted = mark.copy()
    fitted.thumbnail((max_box, max_box), Image.Resampling.LANCZOS)

    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    rounded.alpha_composite(fitted, (x, y))
    return rounded


def compose_maskable_icon(mark: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*MASKABLE_BG_COLOR, 255))

    safe_size = int(size * (1 - (SAFE_PADDING_RATIO * 2)))
    safe_x = (size - safe_size) // 2
    safe_y = (size - safe_size) // 2

    max_box = int(safe_size * MASKABLE_MARK_RATIO)
    fitted = mark.copy()
    fitted.thumbnail((max_box, max_box), Image.Resampling.LANCZOS)

    x = safe_x + (safe_size - fitted.width) // 2
    y = safe_y + (safe_size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def save_png(image: Image.Image, filename: str) -> None:
    image.save(PUBLIC_DIR / filename, format="PNG", optimize=True)


def save_ico(images: list[Image.Image], filename: str) -> None:
    ico_path = PUBLIC_DIR / filename
    images[0].save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=images[1:],
    )


def main() -> None:
    mark = load_mark(SOURCE_ICON)

    standard_sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon-48x48.png": 48,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    generated: dict[str, Image.Image] = {}
    for filename, size in standard_sizes.items():
        generated[filename] = compose_icon(mark, size, STANDARD_MARK_RATIO, BG_COLOR)
        save_png(generated[filename], filename)

    maskable_icons = {
        "android-chrome-maskable-192x192.png": 192,
        "android-chrome-maskable-512x512.png": 512,
    }
    for filename, size in maskable_icons.items():
        image = compose_maskable_icon(mark, size)
        save_png(image, filename)

    save_ico(
        [
            generated["favicon-16x16.png"],
            generated["favicon-32x32.png"],
            generated["favicon-48x48.png"],
        ],
        "favicon.ico",
    )

    print("generated favicon assets:")
    for name in list(standard_sizes) + list(maskable_icons) + ["favicon.ico"]:
        print(f"  - {PUBLIC_DIR / name}")


if __name__ == "__main__":
    main()
