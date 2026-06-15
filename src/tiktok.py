import hashlib
import hmac
import json
import time
import requests


class TikTokShopClient:
    BASE_URL = "https://open-api.tiktok-shops.com"

    def __init__(self, app_key: str, app_secret: str, access_token: str, shop_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = access_token
        self.shop_id = shop_id

    def _sign_request(self, params: dict, body: str = "") -> str:
        all_keys = sorted(params.keys())
        sign_string = self.app_secret
        for key in all_keys:
            sign_string += key + str(params[key])

        if body:
            try:
                body_dict = json.loads(body)
                body_keys = sorted(body_dict.keys())
                for key in body_keys:
                    sign_string += key + str(body_dict[key])
            except (json.JSONDecodeError, AttributeError):
                pass

        sign_string += self.app_secret

        signature = hmac.new(
            self.app_secret.encode("utf-8"),
            sign_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return signature

    def _build_params(self, extra: dict = None) -> dict:
        params = {
            "app_key": self.app_key,
            "access_token": self.access_token,
            "shop_id": self.shop_id,
            "timestamp": str(int(time.time())),
        }
        if extra:
            params.update(extra)
        return params

    def _request(self, method: str, path: str, body: dict = None) -> dict:
        params = self._build_params()
        body_str = json.dumps(body) if body else ""
        params["sign"] = self._sign_request(params, body_str)

        url = f"{self.BASE_URL}{path}"
        headers = {"Content-Type": "application/json"}

        response = requests.request(
            method, url, params=params, data=body_str or None, headers=headers
        )
        if not response.ok:
            raise RuntimeError(
                f"TikTok Shop API error {response.status_code} on {method} {path}: {response.text}"
            )
        data = response.json()
        if data.get("code") != 0:
            raise RuntimeError(
                f"TikTok Shop API returned error: {data.get('message', 'Unknown error')} (code={data.get('code')})"
            )
        return data

    def upload_image(self, image_path: str) -> str:
        params = self._build_params()
        params["sign"] = self._sign_request(params)

        url = f"{self.BASE_URL}/product/202309/images/upload"
        with open(image_path, "rb") as f:
            files = {"data": (image_path.split("/")[-1], f, "image/png")}
            response = requests.post(url, params=params, files=files)

        if not response.ok:
            raise RuntimeError(
                f"TikTok image upload error {response.status_code}: {response.text}"
            )
        data = response.json()
        if data.get("code") != 0:
            raise RuntimeError(
                f"TikTok image upload error: {data.get('message')} (code={data.get('code')})"
            )
        return data["data"]["img_id"]

    def create_product(
        self,
        title: str,
        description: str,
        images: list,
        price_usd: float,
        category_id: str = "601310",
    ) -> dict:
        image_objects = [{"img_id": img_id} for img_id in images]

        price_cents = str(int(price_usd * 100))

        payload = {
            "title": title,
            "description": description,
            "category_id": category_id,
            "main_images": image_objects,
            "skus": [
                {
                    "price": {
                        "amount": price_cents,
                        "currency": "USD",
                    },
                    "inventory": [
                        {
                            "quantity": 999,
                        }
                    ],
                }
            ],
            "package_weight": {
                "unit": "POUND",
                "value": "0.5",
            },
            "package_dimensions": {
                "length": "10",
                "width": "8",
                "height": "1",
                "unit": "INCH",
            },
        }

        return self._request("POST", "/product/202309/products", body=payload)
