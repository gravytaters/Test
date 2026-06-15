import os
import requests
from google import genai
from google.genai import types


BLANK_MOCKUP_URLS = {
    "t-shirt": "https://images.printify.com/mockup/5/29/front.jpg",
    "hoodie": "https://images.printify.com/mockup/77/29/front.jpg",
    "mug": "https://images.printify.com/mockup/68/27/front.jpg",
    "tote-bag": "https://images.printify.com/mockup/87/29/front.jpg",
}

BACKGROUND_STYLES = [
    "a bright, airy minimalist studio with natural light streaming through large windows",
    "a cozy lifestyle setting with warm tones and soft bokeh background",
    "an outdoor urban setting with a trendy street style aesthetic",
]


class MockupGenerator:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def _load_image_bytes(self, path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()

    def _download_blank_template(self, product_type: str) -> bytes | None:
        url = BLANK_MOCKUP_URLS.get(product_type)
        if not url:
            return None
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            return response.content
        except Exception:
            return None

    def generate_mockups(
        self,
        design_path: str,
        product_type: str,
        style: str = "lifestyle",
        count: int = 3,
    ) -> list:
        os.makedirs("output/mockups", exist_ok=True)

        design_bytes = self._load_image_bytes(design_path)

        saved_paths = []
        for i in range(count):
            background = BACKGROUND_STYLES[i % len(BACKGROUND_STYLES)]
            prompt = (
                f"You are creating a professional product mockup for an online store. "
                f"Take this design and place it on a {product_type} in a {style} setting. "
                f"The background should be {background}. "
                f"Make it look professional, well-lit, and suitable for an e-commerce listing."
            )

            parts = [
                types.Part.from_bytes(data=design_bytes, mime_type="image/png"),
                types.Part.from_text(text=prompt),
            ]

            response = self.client.models.generate_content(
                model="gemini-2.0-flash-preview-image-generation",
                contents=parts,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )

            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if part.inline_data and part.inline_data.data:
                        output_path = f"output/mockups/mockup_{i}.png"
                        with open(output_path, "wb") as f:
                            f.write(part.inline_data.data)
                        saved_paths.append(output_path)
                        break

        return saved_paths
