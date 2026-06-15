import base64
import requests


class PrintifyClient:
    BASE_URL = "https://api.printify.com/v1"

    def __init__(self, api_key: str, shop_id: str):
        self.shop_id = shop_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        })

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.BASE_URL}{path}"
        response = self.session.request(method, url, **kwargs)
        if not response.ok:
            raise RuntimeError(
                f"Printify API error {response.status_code} on {method} {path}: {response.text}"
            )
        return response.json()

    def upload_image(self, image_path: str) -> dict:
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        filename = image_path.split("/")[-1]
        payload = {
            "file_name": filename,
            "contents": image_data,
        }
        result = self._request("POST", "/uploads/images.json", json=payload)
        return {"id": result["id"], "preview_url": result.get("preview_url", "")}

    def create_product(
        self,
        title: str,
        description: str,
        tags: list,
        blueprint_id: int,
        print_provider_id: int,
        image_id: str,
        variant_ids: list = None,
    ) -> dict:
        if variant_ids is None:
            variant_ids = [18484, 18485, 18486, 18487]

        variants = [
            {"id": vid, "price": 2499, "is_enabled": True}
            for vid in variant_ids
        ]

        payload = {
            "title": title,
            "description": description,
            "tags": tags,
            "blueprint_id": blueprint_id,
            "print_provider_id": print_provider_id,
            "variants": variants,
            "print_areas": [
                {
                    "variant_ids": variant_ids,
                    "placeholders": [
                        {
                            "position": "front",
                            "images": [
                                {
                                    "id": image_id,
                                    "x": 0.5,
                                    "y": 0.5,
                                    "scale": 1.0,
                                    "angle": 0,
                                }
                            ],
                        }
                    ],
                }
            ],
        }
        return self._request("POST", f"/shops/{self.shop_id}/products.json", json=payload)

    def publish_product(self, product_id: str) -> dict:
        payload = {
            "title": True,
            "description": True,
            "images": True,
            "variants": True,
            "tags": True,
            "keyFeatures": True,
            "shipping_template": True,
        }
        return self._request(
            "POST",
            f"/shops/{self.shop_id}/products/{product_id}/publish.json",
            json=payload,
        )

    def get_product(self, product_id: str) -> dict:
        return self._request("GET", f"/shops/{self.shop_id}/products/{product_id}.json")
