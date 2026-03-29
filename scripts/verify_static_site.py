from __future__ import annotations

from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
GA_ID = "G-YBL4G4K19Y"
IGNORE_DIRS = {"templates", "partials", "read-me-first", "data"}
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def iter_public_html(root: Path):
    for path in root.rglob("*.html"):
        rel = path.relative_to(root)
        if rel.parts and rel.parts[0] in IGNORE_DIRS:
            continue
        yield path


def public_url_for(path: Path) -> str:
    rel = path.relative_to(ROOT)
    if rel.name == "404.html":
        return "https://workrightsuk.co.uk/404.html"
    if rel.name == "index.html":
        parts = rel.parts[:-1]
        if not parts:
            return "https://workrightsuk.co.uk/"
        return "https://workrightsuk.co.uk/" + "/".join(parts) + "/"
    return "https://workrightsuk.co.uk/" + "/".join(rel.parts)


def check_html(path: Path):
    text = path.read_text(encoding="utf-8")
    issues = []
    checks = {
        "ga": GA_ID in text,
        "jsonld": 'application/ld+json' in text,
        "canonical": bool(re.search(r"<link[^>]+rel=[\"']canonical[\"']", text, flags=re.I)),
        "description": 'name="description"' in text or "name='description'" in text,
        "og_title": 'property="og:title"' in text,
        "twitter_card": 'name="twitter:card"' in text,
    }
    for name, ok in checks.items():
        if not ok:
            issues.append(name)
    title_match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else ""
    return title, issues


def load_sitemap():
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        return set(), ["sitemap_missing"]
    try:
        tree = ET.parse(sitemap)
        urls = {loc.text.strip() for loc in tree.findall('.//sm:loc', NS) if loc.text}
        return urls, []
    except Exception as exc:
        return set(), [f"sitemap_parse_error: {exc}"]


def main():
    sitemap_urls, sitemap_issues = load_sitemap()
    results = []
    missing_from_sitemap = []
    for html in sorted(iter_public_html(ROOT)):
        title, issues = check_html(html)
        url = public_url_for(html)
        if html.name != "404.html" and url not in sitemap_urls:
            missing_from_sitemap.append(url)
        results.append((html.relative_to(ROOT).as_posix(), title, issues))

    print("WorkRightsUK static verification")
    print("=" * 32)
    for item, title, issues in results:
        state = "PASS" if not issues else "WARN"
        print(f"[{state}] {item}")
        if title:
            print(f"  title: {title}")
        if issues:
            print("  missing:", ", ".join(issues))

    if sitemap_issues:
        print("\nSitemap issues:")
        for issue in sitemap_issues:
            print("-", issue)

    if missing_from_sitemap:
        print("\nMissing from sitemap:")
        for url in missing_from_sitemap:
            print("-", url)
    else:
        print("\nAll public HTML routes are present in sitemap.xml")


if __name__ == "__main__":
    main()
