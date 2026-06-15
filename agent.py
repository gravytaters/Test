import json
import os
import anthropic
import config
from src.printify import PrintifyClient
from src.mockup import MockupGenerator
from src.etsy import EtsyClient
from src.tiktok import TikTokShopClient


TOOLS = [
    {
        "name": "upload_design_to_printify",
        "description": "Upload a design image to Printify and get back an image ID for use in product creation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "image_path": {
                    "type": "string",
                    "description": "Local file path to the design image.",
                }
            },
            "required": ["image_path"],
        },
    },
    {
        "name": "create_printify_product",
        "description": "Create a product on Printify using the uploaded design image ID and SEO content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Product title."},
                "description": {"type": "string", "description": "Product description."},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of product tags.",
                },
                "blueprint_id": {
                    "type": "integer",
                    "description": "Printify blueprint ID for the product type.",
                },
                "print_provider_id": {
                    "type": "integer",
                    "description": "Printify print provider ID.",
                },
                "image_id": {
                    "type": "string",
                    "description": "Image ID returned from upload_design_to_printify.",
                },
            },
            "required": [
                "title",
                "description",
                "tags",
                "blueprint_id",
                "print_provider_id",
                "image_id",
            ],
        },
    },
    {
        "name": "generate_mockups",
        "description": "Generate lifestyle mockup images using Gemini image generation (Nano Banana). Returns a list of saved file paths.",
        "input_schema": {
            "type": "object",
            "properties": {
                "design_path": {
                    "type": "string",
                    "description": "Local file path to the design image.",
                },
                "product_type": {
                    "type": "string",
                    "description": "Type of product (e.g. t-shirt, hoodie, mug, tote-bag).",
                },
                "style": {
                    "type": "string",
                    "description": "Mockup style (e.g. lifestyle, studio, outdoor).",
                    "default": "lifestyle",
                },
                "count": {
                    "type": "integer",
                    "description": "Number of mockup images to generate.",
                    "default": 3,
                },
            },
            "required": ["design_path", "product_type"],
        },
    },
    {
        "name": "create_etsy_listing",
        "description": "Create a draft Etsy listing with mockup images and SEO content, then publish it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Etsy listing title (max 140 characters).",
                },
                "description": {
                    "type": "string",
                    "description": "Etsy listing description (300+ words, keyword-rich).",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of up to 13 Etsy tags.",
                },
                "price_usd": {
                    "type": "number",
                    "description": "Listing price in USD.",
                },
                "mockup_paths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of local file paths to mockup images.",
                },
            },
            "required": ["title", "description", "tags", "price_usd", "mockup_paths"],
        },
    },
    {
        "name": "create_tiktok_product",
        "description": "Create a TikTok Shop product listing with mockup images and SEO content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "TikTok product title.",
                },
                "description": {
                    "type": "string",
                    "description": "TikTok product description.",
                },
                "price_usd": {
                    "type": "number",
                    "description": "Product price in USD.",
                },
                "mockup_paths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of local file paths to mockup images.",
                },
            },
            "required": ["title", "description", "price_usd", "mockup_paths"],
        },
    },
    {
        "name": "publish_printify_product",
        "description": "Publish a Printify product to all connected sales channels.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "Printify product ID to publish.",
                }
            },
            "required": ["product_id"],
        },
    },
]

SYSTEM_PROMPT = (
    "You are an expert Etsy/TikTok seller and SEO specialist running a print-on-demand business. "
    "Your task is to take a design and publish it as a product on Printify, Etsy, and TikTok Shop. "
    "You will generate highly SEO-optimized titles (max 140 chars for Etsy), descriptions "
    "(detailed, keyword-rich, 300+ words for Etsy, shorter for TikTok), and tags "
    "(13 for Etsy, 20 for TikTok) based on the product type and niche. "
    "Follow this workflow: "
    "1) Upload design to Printify, "
    "2) Generate mockups, "
    "3) Create Printify product, "
    "4) Create Etsy listing with mockups, "
    "5) Create TikTok Shop product with mockups, "
    "6) Publish Printify product. "
    "Use all available tools systematically."
)


class PrintifyWorkflowAgent:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.printify = PrintifyClient(config.PRINTIFY_API_KEY, config.PRINTIFY_SHOP_ID)
        self.mockup_gen = MockupGenerator(config.GOOGLE_API_KEY)
        self.etsy = EtsyClient(config.ETSY_ACCESS_TOKEN, config.ETSY_SHOP_ID)
        self.tiktok = TikTokShopClient(
            config.TIKTOK_APP_KEY,
            config.TIKTOK_APP_SECRET,
            config.TIKTOK_ACCESS_TOKEN,
            config.TIKTOK_SHOP_ID,
        )
        self.anthropic_client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.results = {}

    def run(
        self,
        design_path: str,
        product_type: str,
        niche: str,
        price_usd: float = 24.99,
        mockup_style: str = "lifestyle",
    ) -> dict:
        blueprint = config.PRODUCT_BLUEPRINTS.get(product_type, config.PRODUCT_BLUEPRINTS["t-shirt"])

        initial_message = (
            f"Create and publish a product: "
            f"design_path={design_path}, "
            f"product_type={product_type}, "
            f"niche={niche}, "
            f"price=${price_usd}. "
            f"Blueprint ID: {blueprint['blueprint_id']}, "
            f"Print Provider ID: {blueprint['print_provider_id']}. "
            f"Please proceed with the full workflow."
        )

        messages = [{"role": "user", "content": initial_message}]

        print(f"\n[Agent] Starting workflow for: {product_type} | niche: {niche}")
        print(f"[Agent] Design: {design_path} | Price: ${price_usd}")
        print("-" * 60)

        while True:
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=8096,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "end_turn":
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text = block.text
                        break
                print(f"\n[Agent] Workflow complete:\n{final_text}")
                break

            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type != "tool_use":
                        continue

                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id

                    print(f"\n[Tool] Calling: {tool_name}")
                    print(f"[Tool] Input: {json.dumps(tool_input, indent=2)}")

                    try:
                        result = self._execute_tool(tool_name, tool_input, mockup_style)
                        print(f"[Tool] Result: {json.dumps(result, indent=2)}")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": json.dumps(result),
                        })
                    except Exception as e:
                        error_msg = str(e)
                        print(f"[Tool] Error: {error_msg}")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": f"Error: {error_msg}",
                            "is_error": True,
                        })

                messages.append({"role": "user", "content": tool_results})

        self._save_results()
        return self.results

    def _execute_tool(self, name: str, input_dict: dict, mockup_style: str = "lifestyle") -> dict:
        if self.dry_run:
            return self._dry_run_tool(name, input_dict)

        if name == "upload_design_to_printify":
            result = self.printify.upload_image(input_dict["image_path"])
            self.results["printify_image_id"] = result["id"]
            return result

        if name == "create_printify_product":
            result = self.printify.create_product(
                title=input_dict["title"],
                description=input_dict["description"],
                tags=input_dict["tags"],
                blueprint_id=input_dict["blueprint_id"],
                print_provider_id=input_dict["print_provider_id"],
                image_id=input_dict["image_id"],
            )
            self.results["printify_product_id"] = result["id"]
            return {"product_id": result["id"], "title": result.get("title", "")}

        if name == "generate_mockups":
            paths = self.mockup_gen.generate_mockups(
                design_path=input_dict["design_path"],
                product_type=input_dict["product_type"],
                style=input_dict.get("style", mockup_style),
                count=input_dict.get("count", 3),
            )
            self.results["mockup_paths"] = paths
            return {"mockup_paths": paths, "count": len(paths)}

        if name == "create_etsy_listing":
            listing = self.etsy.create_listing(
                title=input_dict["title"],
                description=input_dict["description"],
                tags=input_dict["tags"],
                price_usd=input_dict["price_usd"],
            )
            listing_id = listing["listing_id"]

            for rank, path in enumerate(input_dict.get("mockup_paths", []), start=1):
                if os.path.exists(path):
                    self.etsy.upload_listing_image(listing_id, path, rank=rank)

            published = self.etsy.publish_listing(listing_id)
            self.results["etsy_listing_id"] = listing_id
            self.results["etsy_listing_url"] = (
                f"https://www.etsy.com/listing/{listing_id}"
            )
            return {
                "listing_id": listing_id,
                "url": self.results["etsy_listing_url"],
                "state": published.get("state", "active"),
            }

        if name == "create_tiktok_product":
            mockup_paths = input_dict.get("mockup_paths", [])
            image_ids = []
            for path in mockup_paths:
                if os.path.exists(path):
                    img_id = self.tiktok.upload_image(path)
                    image_ids.append(img_id)

            result = self.tiktok.create_product(
                title=input_dict["title"],
                description=input_dict["description"],
                images=image_ids,
                price_usd=input_dict["price_usd"],
            )
            product_id = result.get("data", {}).get("product_id", "")
            self.results["tiktok_product_id"] = product_id
            return {"product_id": product_id, "status": "created"}

        if name == "publish_printify_product":
            result = self.printify.publish_product(input_dict["product_id"])
            self.results["printify_published"] = True
            return {"published": True, "product_id": input_dict["product_id"]}

        raise ValueError(f"Unknown tool: {name}")

    def _dry_run_tool(self, name: str, input_dict: dict) -> dict:
        print(f"[DRY RUN] Would execute: {name}")

        if name == "upload_design_to_printify":
            result = {"id": "dry-run-image-id-12345", "preview_url": "https://example.com/preview.png"}
            self.results["printify_image_id"] = result["id"]
            return result

        if name == "create_printify_product":
            result = {"product_id": "dry-run-product-id-67890", "title": input_dict.get("title", "")}
            self.results["printify_product_id"] = result["product_id"]
            return result

        if name == "generate_mockups":
            paths = [
                "output/mockups/mockup_0.png",
                "output/mockups/mockup_1.png",
                "output/mockups/mockup_2.png",
            ]
            self.results["mockup_paths"] = paths
            return {"mockup_paths": paths, "count": 3}

        if name == "create_etsy_listing":
            listing_id = 99999999
            self.results["etsy_listing_id"] = listing_id
            self.results["etsy_listing_url"] = f"https://www.etsy.com/listing/{listing_id}"
            return {
                "listing_id": listing_id,
                "url": self.results["etsy_listing_url"],
                "state": "active",
            }

        if name == "create_tiktok_product":
            product_id = "dry-run-tiktok-product-id"
            self.results["tiktok_product_id"] = product_id
            return {"product_id": product_id, "status": "created"}

        if name == "publish_printify_product":
            self.results["printify_published"] = True
            return {"published": True, "product_id": input_dict.get("product_id", "")}

        raise ValueError(f"Unknown tool: {name}")

    def _save_results(self):
        os.makedirs("output", exist_ok=True)
        output_path = "output/workflow_results.json"
        with open(output_path, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"\n[Agent] Results saved to {output_path}")
