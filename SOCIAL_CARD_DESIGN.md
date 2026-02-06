# Social Card Design System

Reference for generating consistent social card / Open Graph images for ScrimbAGuide.

## Quick Start

```bash
# Generate all blog social cards (skips existing)
npm run generate:social-cards

# Force regenerate all
node scripts/generate-social-cards.mjs --force
```

## Dimensions

- **Size:** 1200 x 630 px (Open Graph / Twitter Card standard)
- **Format:** PNG (converted from SVG via `rsvg-convert`)
- **Output path:** `static/img/blog/{slug}.png`

## Design Tokens

| Token            | Value     | Usage                         |
|------------------|-----------|-------------------------------|
| Brand purple     | `#5b3fd9` | Background gradient start     |
| Brand light      | `#7c5ce7` | Background gradient end       |
| Text white       | `#ffffff` | Title text                    |
| Text muted       | `#e0d9ff` | Subtitle, brand name, URL     |
| Overlay circles  | `#ffffff` | 3-5% opacity, decorative      |
| Border           | `#ffffff` | 20% opacity, 3px, rx=20       |

## Layout

```
+------------------------------------------+
|  [SG] ScrimbAGuide                       |  <- Brand badge (top-left)
|                                          |
|  Title Line 1                            |  <- Bold, 58px, white
|  Title Line 2                            |     Max 3 lines, left-aligned
|  Title Line 3                            |     ~26 chars per line
|                                          |
|  scrimbaguide.tech              [Review] |  <- URL + category pill
+------------------------------------------+
```

## Typography

- **Font family:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Title:** 58px, weight 800, letter-spacing -1
- **Brand badge "SG":** 22px, weight 800
- **Brand name:** 22px, weight 600, muted color
- **URL text:** 22px, weight 400, muted at 70% opacity
- **Category pill:** 18px, weight 600, muted color inside white 15% rounded rect

## Category Labels

| Tag in frontmatter | Display Label |
|---------------------|---------------|
| `review`            | Review        |
| `comparison`        | Comparison    |
| `guide`             | Guide         |
| `pricing`           | Pricing       |
| `courses`           | Courses       |
| `career`            | Career        |
| `ai`                | AI            |

The first tag in the blog post's `tags` frontmatter field is used.

## Adding a New Blog Post

1. Create the `.mdx` file in `blog/` with frontmatter including:
   ```yaml
   slug: my-new-post
   title: "My New Post Title"
   tags: [guide]
   image: /img/blog/my-new-post.png
   ```
2. Run `npm run generate:social-cards` -- it will generate the new image
3. The existing images won't be regenerated (use `--force` if needed)

## AI Image Generation Prompt

If you want to generate these images using an AI tool (e.g., Midjourney, DALL-E) instead of the SVG generator, use this prompt template:

> Minimal, modern social media card image for a tech blog. Purple gradient
> background (#5b3fd9 to #7c5ce7). Clean sans-serif typography. Title text in
> bold white reads: "[YOUR TITLE HERE]". Small "ScrimbAGuide" branding in
> top-left corner. Category label "[CATEGORY]" in a subtle pill badge at
> bottom-right. URL "scrimbaguide.tech" at bottom-left. Subtle decorative
> circles in the background at low opacity. Thin rounded white border.
> Professional, minimal, no illustrations or photos. 1200x630 pixels.

## Dependencies

- `rsvg-convert` (from `librsvg`) -- for SVG to PNG conversion
- Node.js 20+ -- for running the generator script
