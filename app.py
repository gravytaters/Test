import base64
import io
import json
import os
import re
import uuid

import anthropic
from flask import Flask, jsonify, render_template, request
from PIL import Image, ImageDraw, ImageFilter

app = Flask(__name__)

MOCKUP_FOLDER = "mockups"
os.makedirs("uploads", exist_ok=True)
os.makedirs(MOCKUP_FOLDER, exist_ok=True)

client = anthropic.Anthropic()


def generate_listing_text(img_bytes: bytes, media_type: str) -> dict:
    img_base64 = base64.standard_b64encode(img_bytes).decode("utf-8")
    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": img_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Analyze this design image and create an Etsy listing. "
                            "Return ONLY valid JSON with exactly these keys:\n\n"
                            "{\n"
                            '  "title": "SEO-optimized title under 140 chars, use | to separate key phrases",\n'
                            '  "description": "4 paragraphs: (1) engaging hook about the design, '
                            "(2) describe style/colors/aesthetic, (3) list potential products/uses, "
                            '(4) call to action",\n'
                            '  "tags": ["tag1", "tag2", ... 13 specific searchable Etsy tags]\n'
                            "}\n\n"
                            "Make the listing feel warm, artisan, and Etsy-authentic. "
                            "Tags should mix broad and niche search terms."
                        ),
                    },
                ],
            }
        ],
    )

    text = message.content[0].text
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"title": "", "description": text, "tags": []}


# ── Mockup generators ────────────────────────────────────────────────────────

def _paste_design(canvas: Image.Image, design: Image.Image, box_x, box_y, box_w, box_h):
    thumb = design.copy()
    thumb.thumbnail((box_w, box_h), Image.LANCZOS)
    x = box_x + (box_w - thumb.width) // 2
    y = box_y + (box_h - thumb.height) // 2
    if thumb.mode == "RGBA":
        canvas.paste(thumb, (x, y), thumb)
    else:
        canvas.paste(thumb, (x, y))


def _drop_shadow(draw: ImageDraw.ImageDraw, points, offset=8, fill="#b0a898"):
    shifted = [(px + offset, py + offset) for px, py in points]
    draw.polygon(shifted, fill=fill)


def mockup_canvas_print(design: Image.Image, sid: str) -> str:
    W, H = 900, 900
    bg = Image.new("RGB", (W, H), "#f2ede6")
    draw = ImageDraw.Draw(bg)

    fx, fy, fw, fh = 100, 120, 700, 560
    # shadow
    draw.rectangle([fx + 10, fy + 10, fx + fw + 10, fy + fh + 10], fill="#c4bdb4")
    # frame
    draw.rectangle([fx, fy, fx + fw, fy + fh], fill="#ffffff")
    # inner mat
    mat = 30
    draw.rectangle([fx + mat, fy + mat, fx + fw - mat, fy + fh - mat], fill="#fafafa")
    # frame edge detail
    draw.rectangle([fx, fy, fx + fw, fy + fh], outline="#e0d8cf", width=3)
    draw.rectangle([fx + mat, fy + mat, fx + fw - mat, fy + fh - mat], outline="#ece7df", width=1)

    _paste_design(bg, design, fx + mat + 10, fy + mat + 10, fw - 2 * mat - 20, fh - 2 * mat - 20)

    path = f"{MOCKUP_FOLDER}/{sid}_canvas.jpg"
    bg.save(path, "JPEG", quality=92)
    return path


def mockup_tshirt(design: Image.Image, sid: str) -> str:
    W, H = 900, 900
    bg = Image.new("RGB", (W, H), "#eef0f3")
    draw = ImageDraw.Draw(bg)

    shirt_color = "#ffffff"
    shadow_color = "#c8cdd5"

    # shirt body polygon
    body = [
        (200, 720), (700, 720),
        (700, 310), (620, 290), (590, 240), (540, 210),
        (500, 200), (400, 200), (360, 200),
        (310, 210), (260, 240), (230, 290), (200, 310),
    ]
    left_sleeve = [(200, 310), (120, 380), (90, 440), (130, 480), (200, 460), (200, 380)]
    right_sleeve = [(700, 310), (780, 380), (810, 440), (770, 480), (700, 460), (700, 380)]

    for pts in (body, left_sleeve, right_sleeve):
        _drop_shadow(draw, pts, offset=10, fill=shadow_color)

    draw.polygon(body, fill=shirt_color)
    draw.polygon(left_sleeve, fill=shirt_color)
    draw.polygon(right_sleeve, fill=shirt_color)

    # collar
    draw.ellipse([350, 195, 550, 265], fill="#f5f5f5", outline="#e8e8e8", width=2)

    # subtle seam lines
    draw.line([(200, 390), (700, 390)], fill="#ececec", width=1)

    # design on chest
    _paste_design(bg, design, 300, 310, 300, 270)

    path = f"{MOCKUP_FOLDER}/{sid}_tshirt.jpg"
    bg.save(path, "JPEG", quality=92)
    return path


def mockup_tote(design: Image.Image, sid: str) -> str:
    W, H = 900, 900
    bg = Image.new("RGB", (W, H), "#e8e4dc")
    draw = ImageDraw.Draw(bg)

    bag_color = "#f7f3ec"
    shadow_color = "#c4bfb5"

    bag = [(190, 740), (710, 740), (670, 290), (230, 290)]
    _drop_shadow(draw, bag, offset=12, fill=shadow_color)
    draw.polygon(bag, fill=bag_color)
    draw.line(bag + [bag[0]], fill="#ddd8cf", width=2)

    # stitching detail along edges
    for i in range(0, 460, 14):
        draw.line([(230 + i * 0.09, 310 + i * 0.02), (230 + i * 0.09 + 6, 310 + i * 0.02)],
                  fill="#e8e2d8", width=1)

    # handles
    for hx in (310, 510):
        draw.arc([hx, 190, hx + 110, 310], 200, 340, fill="#c9c3b8", width=14)

    # design
    _paste_design(bg, design, 270, 360, 360, 310)

    path = f"{MOCKUP_FOLDER}/{sid}_tote.jpg"
    bg.save(path, "JPEG", quality=92)
    return path


def mockup_mug(design: Image.Image, sid: str) -> str:
    W, H = 900, 900
    bg = Image.new("RGB", (W, H), "#ede9e2")
    draw = ImageDraw.Draw(bg)

    mug_color = "#ffffff"
    shadow_color = "#c0bbb3"

    # mug body (slight trapezoid for perspective)
    body = [(220, 660), (680, 660), (640, 240), (260, 240)]
    _drop_shadow(draw, body, offset=12, fill=shadow_color)
    draw.polygon(body, fill=mug_color)
    draw.line(body + [body[0]], fill="#e0dcd4", width=2)

    # rim ellipse
    draw.ellipse([260, 218, 640, 274], fill="#f8f8f6", outline="#e0dcd4", width=3)

    # handle arc
    draw.arc([620, 350, 760, 560], -80, 80, fill="#ddd8d0", width=24)
    draw.arc([620, 350, 760, 560], -80, 80, fill=mug_color, width=17)

    # design on mug
    _paste_design(bg, design, 290, 310, 320, 270)

    path = f"{MOCKUP_FOLDER}/{sid}_mug.jpg"
    bg.save(path, "JPEG", quality=92)
    return path


def mockup_pillow(design: Image.Image, sid: str) -> str:
    W, H = 900, 900
    bg = Image.new("RGB", (W, H), "#e4dfd8")
    draw = ImageDraw.Draw(bg)

    pillow_color = "#fefdf9"
    shadow_color = "#bfbab2"

    # shadow
    draw.rounded_rectangle([178, 188, 738, 728], radius=60, fill=shadow_color)
    # pillow
    draw.rounded_rectangle([165, 175, 725, 715], radius=60, fill=pillow_color)
    # seam
    draw.rounded_rectangle([195, 205, 695, 685], radius=45, outline="#e8e3da", width=3)
    # edge
    draw.rounded_rectangle([165, 175, 725, 715], radius=60, outline="#ddd8cf", width=2)

    # design
    _paste_design(bg, design, 225, 235, 450, 415)

    path = f"{MOCKUP_FOLDER}/{sid}_pillow.jpg"
    bg.save(path, "JPEG", quality=92)
    return path


MOCKUP_FUNCTIONS = [
    ("Canvas Print", mockup_canvas_print),
    ("T-Shirt", mockup_tshirt),
    ("Tote Bag", mockup_tote),
    ("Ceramic Mug", mockup_mug),
    ("Throw Pillow", mockup_pillow),
]


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    if "design" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["design"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    img_bytes = file.read()

    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpeg").lower()
    media_type_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                      "gif": "image/gif", "webp": "image/webp"}
    media_type = media_type_map.get(ext, "image/jpeg")

    try:
        design = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    except Exception as e:
        return jsonify({"error": f"Cannot open image: {e}"}), 400

    sid = uuid.uuid4().hex[:10]

    listing = generate_listing_text(img_bytes, media_type)

    mockups = []
    for name, fn in MOCKUP_FUNCTIONS:
        path = fn(design, sid)
        with open(path, "rb") as f:
            data = base64.b64encode(f.read()).decode("utf-8")
        mockups.append({"name": name, "data": data})
        os.remove(path)

    return jsonify({"listing": listing, "mockups": mockups})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
