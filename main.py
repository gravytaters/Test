import sys
import click
from agent import PrintifyWorkflowAgent


@click.command()
@click.option(
    "--design",
    required=True,
    type=click.Path(exists=False),
    help="Path to the design image file.",
)
@click.option(
    "--product-type",
    default="t-shirt",
    show_default=True,
    type=click.Choice(["t-shirt", "hoodie", "mug", "tote-bag"], case_sensitive=False),
    help="Product type to create.",
)
@click.option(
    "--niche",
    required=True,
    help='Target niche for SEO (e.g. "funny cat lover").',
)
@click.option(
    "--price",
    default=24.99,
    show_default=True,
    type=float,
    help="Listing price in USD.",
)
@click.option(
    "--mockup-style",
    default="lifestyle",
    show_default=True,
    type=click.Choice(["lifestyle", "studio", "outdoor"], case_sensitive=False),
    help="Style of mockup images to generate.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    default=False,
    help="Skip actual API calls and print what would happen.",
)
def main(design, product_type, niche, price, mockup_style, dry_run):
    """
    Printify print-on-demand publishing pipeline.

    Orchestrates uploading a design, generating mockups, and publishing
    listings on Printify, Etsy, and TikTok Shop using a Claude AI agent.
    """
    if dry_run:
        click.echo("=" * 60)
        click.echo("DRY RUN MODE — no real API calls will be made")
        click.echo("=" * 60)

    click.echo(f"\nStarting Printify workflow pipeline:")
    click.echo(f"  Design:       {design}")
    click.echo(f"  Product type: {product_type}")
    click.echo(f"  Niche:        {niche}")
    click.echo(f"  Price:        ${price:.2f}")
    click.echo(f"  Mockup style: {mockup_style}")
    click.echo(f"  Dry run:      {dry_run}")
    click.echo()

    try:
        agent = PrintifyWorkflowAgent(dry_run=dry_run)
        results = agent.run(
            design_path=design,
            product_type=product_type,
            niche=niche,
            price_usd=price,
            mockup_style=mockup_style,
        )

        click.echo("\n" + "=" * 60)
        click.echo("Workflow Results:")
        click.echo("=" * 60)

        if results.get("printify_image_id"):
            click.echo(f"  Printify Image ID:    {results['printify_image_id']}")
        if results.get("printify_product_id"):
            click.echo(f"  Printify Product ID:  {results['printify_product_id']}")
        if results.get("printify_published"):
            click.echo(f"  Printify Published:   yes")
        if results.get("etsy_listing_id"):
            click.echo(f"  Etsy Listing ID:      {results['etsy_listing_id']}")
        if results.get("etsy_listing_url"):
            click.echo(f"  Etsy Listing URL:     {results['etsy_listing_url']}")
        if results.get("tiktok_product_id"):
            click.echo(f"  TikTok Product ID:    {results['tiktok_product_id']}")
        if results.get("mockup_paths"):
            click.echo(f"  Mockups generated:    {len(results['mockup_paths'])}")
            for path in results["mockup_paths"]:
                click.echo(f"    - {path}")

        click.echo()
        click.echo("Results saved to output/workflow_results.json")

    except Exception as e:
        click.echo(f"\nError: {e}", err=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
