from __future__ import annotations

from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
GA_ID = "G-YBL4G4K19Y"
IGNORE_DIRS = {"templates", "partials", "read-me-first", "data"}
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
REPORT_PATH = ROOT / "verify-report.json"
TEXT_REPORT_PATH = ROOT / "verify_out.txt"


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


def extract_meta(text: str, *, name: str | None = None, prop: str | None = None) -> str:
    attr = "name" if name is not None else "property"
    value = name if name is not None else prop
    if value is None:
        return ""
    escaped = re.escape(value)
    patterns = [
        rf"<meta[^>]+{attr}=[\"']{escaped}[\"'][^>]+content=[\"']([^\"']*)[\"']",
        rf"<meta[^>]+content=[\"']([^\"']*)[\"'][^>]+{attr}=[\"']{escaped}[\"']",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            return match.group(1).strip()
    return ""


def check_html(path: Path):
    text = path.read_text(encoding="utf-8")
    issues = []
    title_match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else ""
    description = extract_meta(text, name="description")
    robots = extract_meta(text, name="robots")
    canonical_ok = bool(re.search(r"<link[^>]+rel=[\"']canonical[\"']", text, flags=re.I))
    checks = {
        "ga": GA_ID in text,
        "jsonld": 'application/ld+json' in text,
        "canonical": canonical_ok,
        "description": bool(description),
        "og_title": bool(extract_meta(text, prop="og:title")),
        "og_description": bool(extract_meta(text, prop="og:description")),
        "og_image": bool(extract_meta(text, prop="og:image")),
        "twitter_card": bool(extract_meta(text, name="twitter:card")),
        "twitter_image": bool(extract_meta(text, name="twitter:image")),
        "theme_color": bool(extract_meta(text, name="theme-color")),
        "favicon": 'rel="icon"' in text or "rel='icon'" in text,
    }
    for name, ok in checks.items():
        if not ok:
            issues.append(name)

    if path.name == "404.html":
        if "noindex" not in robots.lower():
            issues.append("robots_noindex")
    else:
        robots_lower = robots.lower()
        if "index" not in robots_lower or "follow" not in robots_lower:
            issues.append("robots_index_follow")
        if "max-image-preview:large" not in robots_lower:
            issues.append("robots_image_preview")

    info = {
        "path": path.relative_to(ROOT).as_posix(),
        "title": title,
        "title_length": len(title),
        "description": description,
        "description_length": len(description),
        "robots": robots,
        "issues": issues,
    }
    return info


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


def build_report():
    sitemap_urls, sitemap_issues = load_sitemap()
    results = []
    missing_from_sitemap = []
    title_map: dict[str, list[str]] = {}
    description_map: dict[str, list[str]] = {}

    for html in sorted(iter_public_html(ROOT)):
        info = check_html(html)
        url = public_url_for(html)
        info["url"] = url
        if html.name != "404.html" and url not in sitemap_urls:
            missing_from_sitemap.append(url)
        if info["title"]:
            title_map.setdefault(info["title"], []).append(info["path"])
        if info["description"]:
            description_map.setdefault(info["description"], []).append(info["path"])
        results.append(info)

    duplicate_titles = {k: v for k, v in title_map.items() if len(v) > 1}
    duplicate_descriptions = {k: v for k, v in description_map.items() if len(v) > 1}

    summary = {
        "pages_checked": len(results),
        "pages_with_issues": sum(1 for item in results if item["issues"]),
        "missing_from_sitemap": len(missing_from_sitemap),
        "duplicate_titles": len(duplicate_titles),
        "duplicate_descriptions": len(duplicate_descriptions),
    }

    return {
        "summary": summary,
        "results": results,
        "missing_from_sitemap": missing_from_sitemap,
        "sitemap_issues": sitemap_issues,
        "duplicate_titles": duplicate_titles,
        "duplicate_descriptions": duplicate_descriptions,
    }


def write_text_report(report: dict):
    lines = []
    lines.append("WorkRightsUK static verification")
    lines.append("=" * 32)
    lines.append(f"Pages checked: {report['summary']['pages_checked']}")
    lines.append(f"Pages with issues: {report['summary']['pages_with_issues']}")
    lines.append(f"Missing from sitemap: {report['summary']['missing_from_sitemap']}")
    lines.append("")
    for item in report["results"]:
        state = "PASS" if not item["issues"] else "WARN"
        lines.append(f"[{state}] {item['path']}")
        if item["title"]:
            lines.append(f"  title: {item['title']}")
        if item["description"]:
            lines.append(f"  description length: {item['description_length']}")
        if item["issues"]:
            lines.append("  missing: " + ", ".join(item["issues"]))
    if report["sitemap_issues"]:
        lines.append("")
        lines.append("Sitemap issues:")
        for issue in report["sitemap_issues"]:
            lines.append(f"- {issue}")
    if report["missing_from_sitemap"]:
        lines.append("")
        lines.append("Missing from sitemap:")
        for url in report["missing_from_sitemap"]:
            lines.append(f"- {url}")
    if report["duplicate_titles"]:
        lines.append("")
        lines.append("Duplicate titles:")
        for title, paths in report["duplicate_titles"].items():
            lines.append(f"- {title}")
            for path in paths:
                lines.append(f"  - {path}")
    if report["duplicate_descriptions"]:
        lines.append("")
        lines.append("Duplicate descriptions:")
        for desc, paths in report["duplicate_descriptions"].items():
            short_desc = desc[:90] + ("..." if len(desc) > 90 else "")
            lines.append(f"- {short_desc}")
            for path in paths:
                lines.append(f"  - {path}")
    text = "\n".join(lines) + "\n"
    TEXT_REPORT_PATH.write_text(text, encoding="utf-8")
    return text


def main():
    report = build_report()
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(write_text_report(report), end="")


if __name__ == "__main__":
    main()
