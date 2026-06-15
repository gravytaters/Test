import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

PRINTIFY_API_KEY = os.getenv("PRINTIFY_API_KEY", "")
PRINTIFY_SHOP_ID = os.getenv("PRINTIFY_SHOP_ID", "")

ETSY_ACCESS_TOKEN = os.getenv("ETSY_ACCESS_TOKEN", "")
ETSY_SHOP_ID = os.getenv("ETSY_SHOP_ID", "")

TIKTOK_APP_KEY = os.getenv("TIKTOK_APP_KEY", "")
TIKTOK_APP_SECRET = os.getenv("TIKTOK_APP_SECRET", "")
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "")
TIKTOK_SHOP_ID = os.getenv("TIKTOK_SHOP_ID", "")

PRODUCT_BLUEPRINTS = {
    "t-shirt": {
        "blueprint_id": 5,
        "print_provider_id": 29,
        "blank_mockup_url": "https://images.printify.com/mockup/5/29/front.jpg",
    },
    "hoodie": {
        "blueprint_id": 77,
        "print_provider_id": 29,
        "blank_mockup_url": "https://images.printify.com/mockup/77/29/front.jpg",
    },
    "mug": {
        "blueprint_id": 68,
        "print_provider_id": 27,
        "blank_mockup_url": "https://images.printify.com/mockup/68/27/front.jpg",
    },
    "tote-bag": {
        "blueprint_id": 87,
        "print_provider_id": 29,
        "blank_mockup_url": "https://images.printify.com/mockup/87/29/front.jpg",
    },
}
