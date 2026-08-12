# SEO Audit

Generated: 2026-08-12T21:55:14.544Z
Base URL: `https://example.com`
Site root: `examples/site`

## Summary

- Pass: 23
- Warn: 0
- Fail: 0

## Routes

| Route | File | Title | Description | H1 | Canonical |
|---|---|---|---|---:|---|
| `/` | `examples/site/index.html` | ExampleRoom - collaborative AI workflow rooms | ExampleRoom helps teams review source-backed work in collaborative AI rooms. | 1 | https://example.com/ |
| `/pricing/` | `examples/site/public/pricing/index.html` | ExampleRoom Pricing | Simple pricing for ExampleRoom collaborative AI workflow rooms. | 1 | https://example.com/pricing/ |
| `/faq/` | `examples/site/public/faq/index.html` | ExampleRoom FAQ | Frequently asked questions about ExampleRoom collaborative AI rooms. | 1 | https://example.com/faq/ |

## Findings

| Status | Check | Path | Detail |
|---|---|---|---|
| pass | `title` | `examples/site/index.html` | / has a title |
| pass | `meta_description` | `examples/site/index.html` | / has a meta description |
| pass | `canonical` | `examples/site/index.html` | / has a canonical URL |
| pass | `single_h1` | `examples/site/index.html` | / has one H1 |
| pass | `title` | `examples/site/public/pricing/index.html` | /pricing/ has a title |
| pass | `meta_description` | `examples/site/public/pricing/index.html` | /pricing/ has a meta description |
| pass | `canonical` | `examples/site/public/pricing/index.html` | /pricing/ has a canonical URL |
| pass | `single_h1` | `examples/site/public/pricing/index.html` | /pricing/ has one H1 |
| pass | `title` | `examples/site/public/faq/index.html` | /faq/ has a title |
| pass | `meta_description` | `examples/site/public/faq/index.html` | /faq/ has a meta description |
| pass | `canonical` | `examples/site/public/faq/index.html` | /faq/ has a canonical URL |
| pass | `single_h1` | `examples/site/public/faq/index.html` | /faq/ has one H1 |
| pass | `root_marker` | `examples/site/index.html` | Root contains og:title |
| pass | `root_marker` | `examples/site/index.html` | Root contains twitter:card |
| pass | `root_marker` | `examples/site/index.html` | Root contains application/ld+json |
| pass | `sitemap_route` | `examples/site/public/sitemap.xml` | Sitemap includes / |
| pass | `sitemap_route` | `examples/site/public/sitemap.xml` | Sitemap includes /pricing/ |
| pass | `sitemap_route` | `examples/site/public/sitemap.xml` | Sitemap includes /faq/ |
| pass | `robots_sitemap` | `examples/site/public/robots.txt` | robots.txt points to sitemap |
| pass | `robots_private_disallow` | `examples/site/public/robots.txt` | robots.txt disallows /*?room= |
| pass | `robots_private_disallow` | `examples/site/public/robots.txt` | robots.txt disallows /*?demo= |
| pass | `robots_private_disallow` | `examples/site/public/robots.txt` | robots.txt disallows /*?create= |
| pass | `private_noindex_guard` | `examples/site/index.html` | Root shell has private-route noindex guard |
