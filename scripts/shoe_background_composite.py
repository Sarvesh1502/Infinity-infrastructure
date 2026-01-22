import argparse
import io
import math
import os
import random
from typing import Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter

try:
    # rembg is optional; script will error with a clear message if missing
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except Exception:
    REMBG_AVAILABLE = False


def ensure_rgba(img: Image.Image) -> Image.Image:
    return img.convert("RGBA") if img.mode != "RGBA" else img


def load_image(path: str) -> Image.Image:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Image not found: {path}")
    return Image.open(path)


def remove_background(img: Image.Image) -> Image.Image:
    if not REMBG_AVAILABLE:
        raise RuntimeError(
            "rembg is not installed. Install dependencies from scripts/requirements-shoe-edit.txt"
        )
    img_rgba = ensure_rgba(img)
    # rembg returns bytes; handle both bytes and Image
    out = rembg_remove(img_rgba)
    if isinstance(out, (bytes, bytearray)):
        return Image.open(io.BytesIO(out)).convert("RGBA")
    elif isinstance(out, Image.Image):
        return out.convert("RGBA")
    else:
        raise RuntimeError("Unexpected output from rembg.remove")


def create_vertical_gradient(size: Tuple[int, int], top: Tuple[int, int, int], bottom: Tuple[int, int, int]) -> Image.Image:
    w, h = size
    base = Image.new("RGB", (w, h), top)
    top_img = Image.new("RGB", (w, h), bottom)
    mask = Image.linear_gradient("L").resize((w, h))
    grad = Image.composite(top_img, base, mask)
    return grad


def draw_subtle_buildings_background(size: Tuple[int, int], seed: Optional[int] = None) -> Image.Image:
    if seed is not None:
        random.seed(seed)
    w, h = size

    # Sky gradient: light warm at top to cooler near horizon
    sky_top = (236, 240, 245)
    sky_bottom = (210, 220, 230)
    bg = create_vertical_gradient((w, h), sky_top, sky_bottom).convert("RGBA")

    draw = ImageDraw.Draw(bg, "RGBA")

    # Parameters for skyline
    ground_y = int(h * 0.72)
    max_height = int(h * 0.38)

    # Layered silhouettes for depth
    layers = [
        {"alpha": 40, "height_scale": 0.55, "blur": 2},
        {"alpha": 60, "height_scale": 0.75, "blur": 1},
        {"alpha": 80, "height_scale": 1.0, "blur": 0},
    ]

    composite = bg.copy()
    for layer in layers:
        layer_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer_img, "RGBA")
        x = 0
        while x < w:
            building_width = random.randint(int(w * 0.03), int(w * 0.08))
            height = int(random.uniform(0.35, layer["height_scale"]) * max_height)
            left = x
            right = min(w, x + building_width)
            top = max(0, ground_y - height)
            # Color: very subtle dark slate with alpha
            shade = random.randint(30, 50)
            alpha = layer["alpha"]
            ld.rectangle([left, top, right, ground_y], fill=(shade, shade, shade, alpha))

            # Occasional roof details
            if random.random() < 0.25:
                roof_h = random.randint(3, 8)
                ld.rectangle([left + 2, top - roof_h, right - 2, top], fill=(shade, shade, shade, int(alpha * 0.9)))

            x += building_width + random.randint(int(w * 0.005), int(w * 0.015))

        if layer["blur"] > 0:
            layer_img = layer_img.filter(ImageFilter.GaussianBlur(radius=layer["blur"]))
        composite.alpha_composite(layer_img)

    # Subtle global blur for background separation
    composite = composite.filter(ImageFilter.GaussianBlur(radius=1.2))

    return composite


def resize_within(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    w, h = img.size
    scale = min(max_w / w, max_h / h)
    if scale >= 1.0:
        return img
    new_size = (int(w * scale), int(h * scale))
    return img.resize(new_size, Image.LANCZOS)


def add_contact_shadow(canvas: Image.Image, subject_alpha: Image.Image, position: Tuple[int, int]) -> None:
    # Create a soft shadow using the subject's alpha projected onto the ground
    sx, sy = position
    w, h = subject_alpha.size

    # Downscale alpha for faster blur, then upscale
    shadow = subject_alpha.copy().convert("L")
    shadow = shadow.point(lambda p: int(p * 0.6))  # stronger base

    # Flatten the shadow vertically and blur
    shadow = shadow.resize((w, max(1, int(h * 0.25))), Image.LANCZOS)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=12))

    # Create colored shadow image
    shadow_rgba = Image.new("RGBA", shadow.size, (0, 0, 0, 0))
    shadow_rgba.putalpha(shadow)

    # Offset slightly below the subject
    offset = (sx, sy + int(h * 0.65))

    # Paste with lower opacity
    temp = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    temp.paste((0, 0, 0, 90), box=offset, mask=shadow_rgba.split()[-1])
    canvas.alpha_composite(temp)


def smart_place_subject(bg: Image.Image, subject: Image.Image, scale: float = 0.76) -> Tuple[Image.Image, Tuple[int, int]]:
    bw, bh = bg.size
    sw, sh = subject.size

    target_w = int(bw * scale)
    target_h = int(bh * scale)

    subj = resize_within(subject, target_w, int(bh * 0.7))
    sw2, sh2 = subj.size

    # Center horizontally, slightly above center vertically
    x = (bw - sw2) // 2
    y = int(bh * 0.5) - sh2 // 2

    composed = bg.copy()
    add_contact_shadow(composed, subj.split()[-1], (x, y))
    composed.alpha_composite(subj, (x, y))
    return composed, (x, y)


def subtle_color_match(fg: Image.Image, bg: Image.Image) -> Image.Image:
    # Simple color match: add slight color cast from background average to foreground
    bg_rgb = bg.convert("RGB")
    bg_thumb = bg_rgb.resize((32, 32), Image.BILINEAR)
    pixels = list(bg_thumb.getdata())
    total = len(pixels)
    r = sum(p[0] for p in pixels) / total
    g = sum(p[1] for p in pixels) / total
    b = sum(p[2] for p in pixels) / total
    tint_color = (
        int(128 + (r - 128) * 0.125),
        int(128 + (g - 128) * 0.125),
        int(128 + (b - 128) * 0.125),
        0,
    )
    tint = Image.new("RGBA", fg.size, tint_color)
    blended = Image.blend(fg, tint, alpha=0.08)
    blended.putalpha(fg.split()[-1])
    return blended


def process(input_path: str, output_path: str, background_path: Optional[str] = None, size: Optional[str] = None, seed: Optional[int] = None) -> None:
    subj_img = load_image(input_path)

    if size:
        try:
            out_w, out_h = map(int, size.lower().split("x"))
        except Exception:
            raise ValueError("Invalid size. Use format WIDTHxHEIGHT, e.g., 2000x2000")
    else:
        # Default to input size or a reasonable max
        out_w, out_h = subj_img.size
        max_side = 2200
        if max(out_w, out_h) > max_side:
            scale = max_side / max(out_w, out_h)
            out_w, out_h = int(out_w * scale), int(out_h * scale)

    # Remove background (and watermark if in background)
    subj_rgba = remove_background(subj_img)

    # Prepare background
    if background_path:
        bg = ensure_rgba(load_image(background_path).resize((out_w, out_h), Image.LANCZOS))
        # Apply a subtle blur so subject pops
        bg = bg.filter(ImageFilter.GaussianBlur(radius=1.2))
    else:
        bg = draw_subtle_buildings_background((out_w, out_h), seed=seed)

    # Slight edge refine to reduce halos
    alpha = subj_rgba.split()[-1]
    refined_alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    subj_refined = subj_rgba.copy()
    subj_refined.putalpha(refined_alpha)

    # Slight color match
    subj_refined = subtle_color_match(subj_refined, bg)

    # Composite and save
    composed, _ = smart_place_subject(bg, subj_refined)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    composed.convert("RGBA").save(output_path)
    print(f"Saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Remove shoe background and place on subtle buildings backdrop.")
    parser.add_argument("input", help="Path to input shoe image")
    parser.add_argument("output", help="Path to output image (PNG recommended)")
    parser.add_argument("--bg", help="Optional background image path (else a subtle skyline is generated)")
    parser.add_argument("--size", help="Output size WxH, e.g., 2000x2000")
    parser.add_argument("--seed", type=int, help="Random seed for skyline generation")

    args = parser.parse_args()
    process(args.input, args.output, background_path=args.bg, size=args.size, seed=args.seed)


if __name__ == "__main__":
    main()
