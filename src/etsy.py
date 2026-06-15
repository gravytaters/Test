import requests


class EtsyClient:
    BASE_URL = "https://openapi.etsy.com/v3/application"

    def __init__(self, access_token: str, shop_id: str):
        self.shop_id = shop_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "x-api-key": access_token,
        })

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.BASE_URL}{path}"
        response = self.session.request(method, url, **kwargs)
        if not response.ok:
            raise RuntimeError(
                f"Etsy API error {response.status_code} on {method} {path}: {response.text}"
            )
        return response.json()

    def create_listing(
        self,
        title: str,
        description: str,
        tags: list,
        price_usd: float,
        quantity: int = 999,
    ) -> dict:
        trimmed_tags = tags[:13]

        payload = {
            "quantity": quantity,
            "title": title[:140],
            "description": description,
            "price": price_usd,
            "who_made": "i_did",
            "when_made": "made_to_order",
            "taxonomy_id": 2078,
            "tags": trimmed_tags,
            "listing_type": "physical",
            "state": "draft",
            "shipping_profile_id": None,
            "materials": [],
            "is_supply": False,
        }

        return self._request(
            "POST",
            f"/shops/{self.shop_id}/listings",
            json=payload,
        )

    def upload_listing_image(self, listing_id, image_path: str, rank: int = 1) -> dict:
        with open(image_path, "rb") as f:
            image_data = f.read()

        filename = image_path.split("/")[-1]

        files = {
            "image": (filename, image_data, "image/png"),
        }
        data = {
            "rank": rank,
            "overwrite": "true",
        }

        headers = {k: v for k, v in self.session.headers.items() if k != "Content-Type"}
        url = f"{self.BASE_URL}/shops/{self.shop_id}/listings/{listing_id}/images"
        response = requests.post(url, headers=headers, files=files, data=data)
        if not response.ok:
            raise RuntimeError(
                f"Etsy image upload error {response.status_code}: {response.text}"
            )
        return response.json()

    def publish_listing(self, listing_id) -> dict:
        return self._request(
            "PATCH",
            f"/shops/{self.shop_id}/listings/{listing_id}",
            json={"state": "active"},
        )
