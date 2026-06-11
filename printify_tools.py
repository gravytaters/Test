import os
import requests
from typing import Any

PRINTIFY_BASE_URL = "https://api.printify.com/v1"


def _get_headers() -> dict:
    api_key = os.environ.get("PRINTIFY_API_KEY")
    if not api_key:
        raise ValueError("PRINTIFY_API_KEY environment variable not set")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "PrintifyAgent/1.0",
    }


def _request(method: str, path: str, **kwargs) -> dict:
    url = f"{PRINTIFY_BASE_URL}{path}"
    resp = requests.request(method, url, headers=_get_headers(), **kwargs)
    if not resp.ok:
        return {"error": f"HTTP {resp.status_code}: {resp.text}"}
    if resp.status_code == 204 or not resp.content:
        return {"success": True}
    return resp.json()


# ── Shops ──────────────────────────────────────────────────────────────────────

def list_shops() -> dict:
    """List all shops connected to the Printify account."""
    return _request("GET", "/shops.json")


# ── Products ──────────────────────────────────────────────────────────────────

def list_products(shop_id: str, page: int = 1, limit: int = 10) -> dict:
    """List products in a shop."""
    return _request("GET", f"/shops/{shop_id}/products.json", params={"page": page, "limit": limit})


def get_product(shop_id: str, product_id: str) -> dict:
    """Get a specific product by ID."""
    return _request("GET", f"/shops/{shop_id}/products/{product_id}.json")


def create_product(shop_id: str, product_data: dict) -> dict:
    """Create a new product in a shop."""
    return _request("POST", f"/shops/{shop_id}/products.json", json=product_data)


def update_product(shop_id: str, product_id: str, product_data: dict) -> dict:
    """Update an existing product."""
    return _request("PUT", f"/shops/{shop_id}/products/{product_id}.json", json=product_data)


def delete_product(shop_id: str, product_id: str) -> dict:
    """Delete a product from a shop."""
    return _request("DELETE", f"/shops/{shop_id}/products/{product_id}.json")


def publish_product(shop_id: str, product_id: str, publish_data: dict) -> dict:
    """Publish a product to the connected sales channel."""
    return _request("POST", f"/shops/{shop_id}/products/{product_id}/publish.json", json=publish_data)


def unpublish_product(shop_id: str, product_id: str) -> dict:
    """Unpublish (set to draft) a product."""
    return _request("POST", f"/shops/{shop_id}/products/{product_id}/unpublish.json")


# ── Orders ────────────────────────────────────────────────────────────────────

def list_orders(shop_id: str, page: int = 1, limit: int = 10, status: str = None) -> dict:
    """List orders for a shop, optionally filtered by status."""
    params = {"page": page, "limit": limit}
    if status:
        params["status"] = status
    return _request("GET", f"/shops/{shop_id}/orders.json", params=params)


def get_order(shop_id: str, order_id: str) -> dict:
    """Get a specific order by ID."""
    return _request("GET", f"/shops/{shop_id}/orders/{order_id}.json")


def submit_order(shop_id: str, order_data: dict) -> dict:
    """Submit a new order for production."""
    return _request("POST", f"/shops/{shop_id}/orders.json", json=order_data)


def send_order_to_production(shop_id: str, order_id: str) -> dict:
    """Send an existing order to production."""
    return _request("POST", f"/shops/{shop_id}/orders/{order_id}/send_to_production.json")


def cancel_order(shop_id: str, order_id: str) -> dict:
    """Cancel an order."""
    return _request("POST", f"/shops/{shop_id}/orders/{order_id}/cancel.json")


def calculate_order_shipping(shop_id: str, order_data: dict) -> dict:
    """Calculate shipping cost for an order."""
    return _request("POST", f"/shops/{shop_id}/orders/shipping.json", json=order_data)


# ── Catalog ───────────────────────────────────────────────────────────────────

def list_catalog_blueprints() -> dict:
    """List all available product blueprints in the Printify catalog."""
    return _request("GET", "/catalog/blueprints.json")


def get_blueprint(blueprint_id: str) -> dict:
    """Get details for a specific blueprint."""
    return _request("GET", f"/catalog/blueprints/{blueprint_id}.json")


def get_blueprint_print_providers(blueprint_id: str) -> dict:
    """Get print providers available for a blueprint."""
    return _request("GET", f"/catalog/blueprints/{blueprint_id}/print_providers.json")


def get_blueprint_variants(blueprint_id: str, print_provider_id: str) -> dict:
    """Get variants (sizes, colors) for a blueprint/print provider combination."""
    return _request(
        "GET",
        f"/catalog/blueprints/{blueprint_id}/print_providers/{print_provider_id}/variants.json",
    )


def get_blueprint_shipping(blueprint_id: str, print_provider_id: str) -> dict:
    """Get shipping info for a blueprint/print provider combination."""
    return _request(
        "GET",
        f"/catalog/blueprints/{blueprint_id}/print_providers/{print_provider_id}/shipping.json",
    )


def list_print_providers() -> dict:
    """List all print providers."""
    return _request("GET", "/catalog/print_providers.json")


def get_print_provider(print_provider_id: str) -> dict:
    """Get details for a specific print provider."""
    return _request("GET", f"/catalog/print_providers/{print_provider_id}.json")


# ── Uploads ───────────────────────────────────────────────────────────────────

def list_uploads(page: int = 1, limit: int = 10) -> dict:
    """List uploaded images."""
    return _request("GET", "/uploads.json", params={"page": page, "limit": limit})


def get_upload(image_id: str) -> dict:
    """Get a specific uploaded image."""
    return _request("GET", f"/uploads/{image_id}.json")


def upload_image_from_url(file_name: str, url: str) -> dict:
    """Upload an image from a URL to Printify."""
    return _request("POST", "/uploads/images.json", json={"file_name": file_name, "url": url})


def archive_upload(image_id: str) -> dict:
    """Archive (delete) an uploaded image."""
    return _request("POST", f"/uploads/{image_id}/archive.json")


# ── Tool registry ─────────────────────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "list_shops",
        "description": "List all shops connected to the Printify account.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "list_products",
        "description": "List products in a shop. Returns paginated results.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "page": {"type": "integer", "description": "Page number (default 1)", "default": 1},
                "limit": {"type": "integer", "description": "Results per page (default 10, max 100)", "default": 10},
            },
            "required": ["shop_id"],
        },
    },
    {
        "name": "get_product",
        "description": "Get full details for a specific product.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_id": {"type": "string", "description": "The product ID"},
            },
            "required": ["shop_id", "product_id"],
        },
    },
    {
        "name": "create_product",
        "description": (
            "Create a new product in a shop. product_data must include: "
            "title (string), blueprint_id (int), print_provider_id (int), "
            "variants (array of {id, price, is_enabled}), "
            "print_areas (array of {variant_ids, placeholders with images})."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_data": {
                    "type": "object",
                    "description": "Product creation payload per Printify API spec",
                },
            },
            "required": ["shop_id", "product_data"],
        },
    },
    {
        "name": "update_product",
        "description": "Update an existing product's details (title, description, variants, images, etc.).",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_id": {"type": "string", "description": "The product ID"},
                "product_data": {"type": "object", "description": "Fields to update"},
            },
            "required": ["shop_id", "product_id", "product_data"],
        },
    },
    {
        "name": "delete_product",
        "description": "Permanently delete a product from a shop.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_id": {"type": "string", "description": "The product ID"},
            },
            "required": ["shop_id", "product_id"],
        },
    },
    {
        "name": "publish_product",
        "description": "Publish a product to the connected sales channel (e.g. Etsy, Shopify).",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_id": {"type": "string", "description": "The product ID"},
                "publish_data": {
                    "type": "object",
                    "description": (
                        "Publish options: title (bool), description (bool), images (bool), "
                        "variants (bool), tags (bool), keyFeatures (bool), shipping_template (bool)"
                    ),
                },
            },
            "required": ["shop_id", "product_id", "publish_data"],
        },
    },
    {
        "name": "unpublish_product",
        "description": "Unpublish a product (set back to draft).",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "product_id": {"type": "string", "description": "The product ID"},
            },
            "required": ["shop_id", "product_id"],
        },
    },
    {
        "name": "list_orders",
        "description": "List orders for a shop with optional status filter.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "page": {"type": "integer", "description": "Page number (default 1)", "default": 1},
                "limit": {"type": "integer", "description": "Results per page (default 10)", "default": 10},
                "status": {
                    "type": "string",
                    "description": "Filter by status: pending, sending_to_production, in_production, canceled, fulfilled",
                },
            },
            "required": ["shop_id"],
        },
    },
    {
        "name": "get_order",
        "description": "Get full details for a specific order.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "order_id": {"type": "string", "description": "The order ID"},
            },
            "required": ["shop_id", "order_id"],
        },
    },
    {
        "name": "submit_order",
        "description": "Submit a new order for production. Requires line_items, shipping_method, and address_to.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "order_data": {
                    "type": "object",
                    "description": "Order payload with line_items, shipping_method, address_to, etc.",
                },
            },
            "required": ["shop_id", "order_data"],
        },
    },
    {
        "name": "send_order_to_production",
        "description": "Send a pending order to production.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "order_id": {"type": "string", "description": "The order ID"},
            },
            "required": ["shop_id", "order_id"],
        },
    },
    {
        "name": "cancel_order",
        "description": "Cancel an order (only possible before it enters production).",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "order_id": {"type": "string", "description": "The order ID"},
            },
            "required": ["shop_id", "order_id"],
        },
    },
    {
        "name": "calculate_order_shipping",
        "description": "Calculate shipping costs for an order before submitting.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shop_id": {"type": "string", "description": "The shop ID"},
                "order_data": {
                    "type": "object",
                    "description": "Order data with line_items and address_to to estimate shipping for",
                },
            },
            "required": ["shop_id", "order_data"],
        },
    },
    {
        "name": "list_catalog_blueprints",
        "description": "Browse all available product types (t-shirts, mugs, posters, etc.) in the Printify catalog.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_blueprint",
        "description": "Get details for a specific catalog blueprint (product type).",
        "input_schema": {
            "type": "object",
            "properties": {
                "blueprint_id": {"type": "string", "description": "The blueprint ID"},
            },
            "required": ["blueprint_id"],
        },
    },
    {
        "name": "get_blueprint_print_providers",
        "description": "Get all print providers that can fulfill a specific blueprint.",
        "input_schema": {
            "type": "object",
            "properties": {
                "blueprint_id": {"type": "string", "description": "The blueprint ID"},
            },
            "required": ["blueprint_id"],
        },
    },
    {
        "name": "get_blueprint_variants",
        "description": "Get available variants (sizes, colors) for a blueprint + print provider combination.",
        "input_schema": {
            "type": "object",
            "properties": {
                "blueprint_id": {"type": "string", "description": "The blueprint ID"},
                "print_provider_id": {"type": "string", "description": "The print provider ID"},
            },
            "required": ["blueprint_id", "print_provider_id"],
        },
    },
    {
        "name": "get_blueprint_shipping",
        "description": "Get shipping information for a blueprint + print provider combination.",
        "input_schema": {
            "type": "object",
            "properties": {
                "blueprint_id": {"type": "string", "description": "The blueprint ID"},
                "print_provider_id": {"type": "string", "description": "The print provider ID"},
            },
            "required": ["blueprint_id", "print_provider_id"],
        },
    },
    {
        "name": "list_print_providers",
        "description": "List all available print providers on Printify.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_print_provider",
        "description": "Get details for a specific print provider.",
        "input_schema": {
            "type": "object",
            "properties": {
                "print_provider_id": {"type": "string", "description": "The print provider ID"},
            },
            "required": ["print_provider_id"],
        },
    },
    {
        "name": "list_uploads",
        "description": "List images previously uploaded to Printify.",
        "input_schema": {
            "type": "object",
            "properties": {
                "page": {"type": "integer", "description": "Page number (default 1)", "default": 1},
                "limit": {"type": "integer", "description": "Results per page (default 10)", "default": 10},
            },
            "required": [],
        },
    },
    {
        "name": "get_upload",
        "description": "Get details for a specific uploaded image.",
        "input_schema": {
            "type": "object",
            "properties": {
                "image_id": {"type": "string", "description": "The image ID"},
            },
            "required": ["image_id"],
        },
    },
    {
        "name": "upload_image_from_url",
        "description": "Upload an image to Printify from a publicly accessible URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_name": {"type": "string", "description": "File name for the upload (e.g. 'design.png')"},
                "url": {"type": "string", "description": "Public URL of the image to upload"},
            },
            "required": ["file_name", "url"],
        },
    },
    {
        "name": "archive_upload",
        "description": "Archive (remove) an uploaded image from Printify.",
        "input_schema": {
            "type": "object",
            "properties": {
                "image_id": {"type": "string", "description": "The image ID to archive"},
            },
            "required": ["image_id"],
        },
    },
]

TOOL_FUNCTIONS: dict[str, Any] = {
    "list_shops": list_shops,
    "list_products": list_products,
    "get_product": get_product,
    "create_product": create_product,
    "update_product": update_product,
    "delete_product": delete_product,
    "publish_product": publish_product,
    "unpublish_product": unpublish_product,
    "list_orders": list_orders,
    "get_order": get_order,
    "submit_order": submit_order,
    "send_order_to_production": send_order_to_production,
    "cancel_order": cancel_order,
    "calculate_order_shipping": calculate_order_shipping,
    "list_catalog_blueprints": list_catalog_blueprints,
    "get_blueprint": get_blueprint,
    "get_blueprint_print_providers": get_blueprint_print_providers,
    "get_blueprint_variants": get_blueprint_variants,
    "get_blueprint_shipping": get_blueprint_shipping,
    "list_print_providers": list_print_providers,
    "get_print_provider": get_print_provider,
    "list_uploads": list_uploads,
    "get_upload": get_upload,
    "upload_image_from_url": upload_image_from_url,
    "archive_upload": archive_upload,
}
