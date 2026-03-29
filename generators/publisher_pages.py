from html import escape

from components.publishing import (
    family_lookup,
    render_ad_slot,
    render_breadcrumb_schema,
    render_breadcrumbs,
    render_faq_schema,
    render_layout,
    render_section_cards,
)
from data.catalog import get_all_calculators, get_cluster_hub_content, get_cluster_intro
from data.publisher import SITE, TRUST_PAGES


def render_authority_panel(page_type: str) -> str:
    label = "calculator" if page_type == "calculator" else page_type
    return (
        '<section class="authority-panel content-card" aria-label="Authority and estimate notes">'
        '<div class="section-head"><h2>Planning estimate notes</h2><p>Use the page for early budgeting and ordering checks, then confirm the final decision against live product information and site conditions.</p></div>'
        '<div class="authority-grid">'
        f'<article class="authority-card"><div class="quality-kicker">Reviewed by</div><h3>{escape(SITE["review_team"])}</h3><p>{escape(SITE["coverage_note"])}</p></article>'
        f'<article class="authority-card"><div class="quality-kicker">Last checked</div><h3>{escape(SITE["updated_label"])}</h3><p>We revisited the formula logic, support guidance, and internal routing for this {escape(label)}.</p></article>'
        f'<article class="authority-card"><div class="quality-kicker">Best for</div><h3>Early planning</h3><p>This page is strongest when you want a fast rough estimate before requesting quotes or placing an order.</p></article>'
        '</div></section>'
    )


def render_methodology_steps(family: dict) -> str:
    steps = [
        ("Measure the job", family["support"].get("measure_step", "Start with the real dimensions, count, depth, or coverage area that drives the job.")),
        ("Apply practical estimating logic", family["support"].get("assumptions", "The page uses estimating assumptions that are intended to be closer to a buying decision than a bare formula.")),
        ("Add waste and buying reality", family["support"].get("mistakes", "The result should be checked against waste, cuts, overlaps, pack sizes, and the way the product is actually sold.")),
        ("Sense-check the order", family["support"].get("final_check", "Before buying, compare the result with product coverage, supplier constraints, delivery minimums, and whether one extra unit is safer than running short.")),
    ]
    items = ''.join(
        f'<article class="method-step"><div class="method-step-number">{index + 1}</div><div><h3>{escape(title)}</h3><p>{escape(body)}</p></div></article>'
        for index, (title, body) in enumerate(steps)
    )
    return f'<section class="content-card methodology-card"><div class="section-head"><h2>How we estimate this</h2><p>These pages combine basic geometry with more practical buying assumptions so the result is more useful for real jobs.</p></div><div class="methodology-steps">{items}</div></section>'


def render_estimate_limits(family: dict) -> str:
    cards = [
        ("Estimate strength", family["support"].get("use_case", "Best for first-pass planning, quick material checks, and comparing likely buying routes.")),
        ("What can change the total", family["support"].get("estimate_tip", "Dimensions, waste, coverage assumptions, site access, and product choice usually move the total the most.")),
        ("When to remeasure", family["support"].get("remeasure_tip", "Remeasure when the layout is irregular, the substrate is poor, or the supplier pack size does not match the default assumptions.")),
    ]
    return '<section class="stack-grid">' + ''.join(
        f'<article class="content-card prose-card"><h2>{escape(title)}</h2><p>{escape(body)}</p></article>'
        for title, body in cards
    ) + '</section>'


def render_assumption_checklist(family: dict) -> str:
    items = [
        family["support"].get("assumptions", "Check the core estimating assumption before you order."),
        family["support"].get("buyer_tip", "Compare pack sizes, coverage, and waste before choosing the cheapest-looking product."),
        family["support"].get("market_note", "Supplier wording, pack sizes, and sales units can vary by market and merchant."),
        family["support"].get("final_check", "Make one final sense-check before the order is placed."),
    ]
    li = ''.join(f'<li>{escape(item)}</li>' for item in items)
    return f'<section class="content-card prose-card"><h2>Before you rely on this estimate</h2><ul class="checklist">{li}</ul></section>'


def render_cost_intelligence_shell() -> str:
    return (
        '<div class="result-intelligence">'
        '<section class="intelligence-panel">'
        '<div class="result-kicker">Estimate range</div>'
        '<h3>Low, mid, and high view</h3>'
        '<div class="scenario-grid" id="estimate-range"><div class="scenario-card"><strong>Waiting for inputs</strong><span>Complete the calculator to see a range.</span></div></div>'
        '<p class="intelligence-copy" id="estimate-drivers">The biggest cost drivers and uncertainty notes will appear here.</p>'
        '<p class="intelligence-copy intelligence-confidence" id="confidence-note">Confidence guidance updates once the calculator has a live result.</p>'
        '</section>'
        '<section class="intelligence-panel">'
        '<div class="result-kicker">Cost breakdown</div>'
        '<h3>What the total usually includes</h3>'
        '<div class="detail-list" id="cost-intelligence-breakdown"><div class="break-row"><span>Materials</span><strong>Waiting for inputs</strong></div></div>'
        '</section>'
        '<section class="intelligence-panel">'
        '<div class="result-kicker">Compare options</div>'
        '<h3>Budget, standard, and higher-spec routes</h3>'
        '<div class="compare-grid" id="comparison-output"><div class="compare-card"><strong>Waiting for inputs</strong><span>Option comparisons appear after a calculation.</span></div></div>'
        '</section>'
        '<section class="intelligence-panel">'
        '<div class="result-kicker">Typical timeline</div>'
        '<h3>Prep, install, and finish</h3>'
        '<div class="detail-list" id="timeline-output"><div class="break-row"><span>Timeline</span><strong>Waiting for inputs</strong></div></div>'
        '</section>'
        '<section class="intelligence-panel">'
        '<div class="result-kicker">Reality check</div>'
        '<h3>Real-world costs people miss</h3>'
        '<ul class="reality-list" id="reality-output"><li>Complete the calculator to see the extra items that commonly catch budgets out.</li></ul>'
        '</section>'
        '</div>'
    )


def build_trust_pages():
    pages = []
    for page in TRUST_PAGES:
        path = f'/{page["slug"]}/'
        crumbs = [("Home", "/"), (page["title"], path)]
        sections = render_section_cards([(item["title"], item["body"]) for item in page["sections"]])
        standards = render_section_cards([
            ("Reviewed by", f"{SITE['review_team']} reviews the wording, estimate framing, and trust notes used across the site."),
            ("Research and maintenance", f"{SITE['research_team']} checks formulas, internal links, and page support blocks when key pages are refreshed."),
            ("Planning-use reminder", "The site is designed for planning decisions and early budgeting, not fixed quotes or engineering sign-off."),
        ])
        content = (
            f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
            f'<div class="eyebrow">Publisher information</div><h1>{escape(page["headline"])}</h1>'
            f'<p class="hero-copy">{escape(page["intro"])}</p></section>'
            f'{render_authority_panel("trust")}'
            f'{render_ad_slot("trust-top")}'
            f'{sections}'
            f'{standards}'
            '</div>'
        )
        html = render_layout(
            title=page["title"],
            description=page["description"],
            path=path,
            content=content,
            schema=[render_breadcrumb_schema(crumbs)],
            page_type="trust",
        )
        pages.append((path, html))
    return pages


def build_cluster_pages():
    pages = []
    clusters = {}
    for item in get_all_calculators():
        clusters.setdefault(item["cluster_slug"], []).append(item)
    for cluster_slug, items in clusters.items():
        family = items[0]
        hub_content = get_cluster_hub_content(cluster_slug)
        key = family["key"]
        path = f'/clusters/{cluster_slug}/'
        crumbs = [("Home", "/"), ("Tool Sets", "/clusters/"), (family["cluster_name"], path)]
        intent_pages = []
        guide_pages = []
        for calculator in items:
            intent_pages.extend(calculator["intent_pages"])
            guide_pages.extend(calculator["guide_pages"])

        featured_slugs = hub_content.get("featured_slugs", [item["slug"] for item in items[:3]])
        featured_items = [item for item in items if item["slug"] in featured_slugs]
        remaining_items = [item for item in items if item["slug"] not in featured_slugs]

        featured_cards = "".join(
            f'<article class="tool-card"><h3><a href="/calculators/{escape(item["slug"])}/">{escape(item["name"])}</a></h3><p>{escape(item["intro"])}</p></article>'
            for item in featured_items
        )
        calculator_cards = "".join(
            f'<article class="tool-card"><h3><a href="/calculators/{escape(item["slug"])}/">{escape(item["name"])}</a></h3><p>{escape(item["intro"])}</p></article>'
            for item in remaining_items
        )
        intent_links = "".join(
            f'<article class="tool-card"><h3><a href="/guides/{escape(item["slug"])}/">{escape(item["title"])}</a></h3><p>{escape(item["description"])}</p></article>'
            for item in intent_pages
        )
        guide_links = "".join(
            f'<article class="tool-card"><h3><a href="/guides/{escape(item["slug"])}/">{escape(item["title"])}</a></h3><p>{escape(item["description"])}</p></article>'
            for item in guide_pages
        )
        featured_section = ""
        if featured_cards:
            featured_section = (
                f'<section class="content-card prose-card"><h2>{escape(hub_content.get("start_here_title", "Start here"))}</h2>'
                f'<p>{escape(hub_content.get("start_here_intro", "Start with the calculator that best matches the main material or buying format for the job."))}</p></section>'
                f'<section class="calculator-grid-section"><div class="calculator-grid">{featured_cards}</div></section>'
            )
        calculator_section = ""
        if calculator_cards:
            calculator_section = (
                '<section class="content-card prose-card"><h2>More tools in this set</h2>'
                '<p>These related tools help when the job involves extra materials, linked quantities, or a different buying format.</p></section>'
                f'<section class="calculator-grid-section"><div class="calculator-grid">{calculator_cards}</div></section>'
            )
        intent_section = ""
        if intent_links:
            intent_section = (
                f'<section class="content-card prose-card"><h2>{escape(hub_content.get("question_heading", "Popular question pages"))}</h2>'
                f'<p>{escape(hub_content.get("question_intro", "Use these pages for faster answers when you already know the basic dimensions of the job."))}</p></section>'
                f'<section class="calculator-grid-section"><div class="calculator-grid">{intent_links}</div></section>'
            )
        guide_section = ""
        if guide_links:
            guide_section = (
                f'<section class="content-card prose-card"><h2>{escape(hub_content.get("guide_heading", "Guides and next steps"))}</h2>'
                f'<p>{escape(hub_content.get("guide_intro", "These guides help explain waste, product choice, and buying format once the first quantity estimate is clear."))}</p></section>'
                f'<section class="calculator-grid-section"><div class="calculator-grid">{guide_links}</div></section>'
            )
        content = (
            f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
            f'<div class="eyebrow">Tool set</div><h1>{escape(family["cluster_name"])}</h1>'
            f'<p class="hero-copy">{escape(get_cluster_intro(cluster_slug, family["intro"]))}</p>'
            f'<div class="hero-badges"><span class="hero-badge">{escape(family["category"])}</span><span class="hero-badge">{len(items)} calculators</span><span class="hero-badge">Related guides included</span></div></section>'
            f'{render_ad_slot(f"{key}-hub-top")}'
            f'{featured_section}'
            f'{calculator_section}'
            f'{render_section_cards(hub_content.get("notes", [("How to use this tool set", "Start with the calculator that matches the material or buying format you actually need, then move into the related guides if you need more detail before buying."), ("What affects estimates most", "Dimensions, depth or coverage assumptions, waste allowance, and pack or stock-length rounding are usually the biggest drivers of the final buying number."), ("Why these guides are useful", "The extra guides in each tool set help explain common mistakes, waste allowances, and buying choices that a simple quantity figure cannot cover on its own.")]))}'
            f'{intent_section}'
            f'{guide_section}</div>'
        )
        html = render_layout(
            title=f'{family["cluster_name"]} | {SITE["name"]}',
            description=f'Browse {family["cluster_name"].lower()} calculators and supporting guides on {SITE["name"]}.',
            path=path,
            content=content,
            schema=[render_breadcrumb_schema(crumbs)],
            page_type="cluster",
        )
        pages.append((path, html))
    return pages


def build_guide_pages():
    pages = []
    for family in get_all_calculators():
        key = family["key"]
        related = family["intent_pages"] + family["guide_pages"]
        for item in related:
            path = f'/guides/{item["slug"]}/'
            crumbs = [("Home", "/"), ("Guides", "/guides/"), (item["title"], path)]
            supporting_cards = [
                ("Why this page exists", family["support"]["use_case"]),
                ("Core assumption", family["support"]["assumptions"]),
                ("Common mistake", family["support"]["mistakes"]),
            ]
            content = (
                f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
                f'<div class="eyebrow">{escape(family["cluster_name"])}</div><h1>{escape(item["headline"])}</h1>'
                f'<p class="hero-copy">{escape(item["intro"])}</p></section>'
                f'{render_authority_panel("guide")}'
                f'{render_ad_slot(f"{key}-guide-top")}'
                f'{render_quality_strip("guide")}'
                f'<section class="content-card prose-card"><h2>Use the calculator first</h2><p>The quickest path is to start with <a href="/calculators/{escape(family["slug"])}">{escape(family["name"])}</a>, then use this guide to sense-check the result and decide what to buy next.</p></section>'
                f'{render_methodology_steps(family)}'
                f'{render_section_cards(supporting_cards)}'
                f'{render_estimate_limits(family)}'
                f'<section class="content-card prose-card"><h2>Next step links</h2><p><a href="/clusters/{escape(family["cluster_slug"])}">Open the full {escape(family["cluster_name"])} tool set</a> or go straight to the <a href="/calculators/{escape(family["slug"])}">{escape(family["name"])}</a>.</p></section>'
                '</div>'
            )
            html = render_layout(
                title=f'{item["title"]} | {SITE["name"]}',
                description=item["description"],
                path=path,
                content=content,
                schema=[render_breadcrumb_schema(crumbs)],
                page_type="guide",
            )
            pages.append((path, html))
    return pages


def render_quality_strip(page_type: str) -> str:
    return (
        '<section class="quality-strip" aria-label="Freshness and methodology">'
        f'<article class="content-card quality-card"><div class="quality-kicker">Last checked</div><h2>{escape(SITE["updated_label"])}</h2><p>We checked the calculator logic, page notes, and related links on this page.</p></article>'
        f'<article class="content-card quality-card"><div class="quality-kicker">Estimate use</div><h2>Planning before buying</h2><p>Use this {escape(page_type)} for early buying and budget checks, then confirm the final order against product data, access, and site conditions.</p></article>'
        f'<article class="content-card quality-card"><div class="quality-kicker">Trust layer</div><h2>{escape(SITE["review_team"])}</h2><p>Read the <a href="{escape(SITE["methodology_path"])}">calculator methodology</a> and <a href="{escape(SITE["editorial_policy_path"])}">editorial policy</a> for the standards behind these pages.</p></article>'
        '</section>'
    )


def build_calculator_support(slug: str) -> str:
    family = family_lookup()[slug]
    key = family["key"]
    faq_html = "".join(
        f'<article class="content-card prose-card"><h2>{escape(item["q"])}</h2><p>{escape(item["a"])}</p></article>'
        for item in family["faqs"]
    )
    next_links = "".join(
        f'<a class="mini-tool-card" href="/guides/{escape(item["slug"])}/">{escape(item["title"])}</a>'
        for item in family["intent_pages"] + family["guide_pages"]
    )
    next_step_section = ""
    if next_links:
        next_step_section = f'<section class="related-tools"><div class="section-head"><h2>Next-step guides</h2><p>Use these guides to sense-check the estimate, avoid common mistakes, and choose the right buying format.</p></div><div class="mini-tool-grid">{next_links}</div></section>'
    return (
        f'{render_authority_panel("calculator")}'
        f'{render_ad_slot(f"{key}-mid")}'
        f'{render_methodology_steps(family)}'
        f'{render_section_cards([("Assumptions", family["support"]["assumptions"]), ("Common mistakes", family["support"]["mistakes"]), ("Best use cases", family["support"]["use_case"]), ("How to get a better estimate", family["support"].get("estimate_tip", "Measure carefully, apply realistic waste, and sense-check the result against how the product is actually sold.")), ("Before you buy", family["support"].get("buyer_tip", "Round to whole buying units and compare product coverage before buying solely on sticker price.")), ("UK and US note", family["support"].get("market_note", "Unit wording and supplier pack conventions differ between markets, but the estimating logic still starts with geometry, waste, and whole-unit ordering.")), ("Final buying check", family["support"].get("final_check", "Before placing an order, compare product coverage, pack size, delivery cost, and whether buying one extra unit is safer than risking a shortfall."))])}'
        f'{render_estimate_limits(family)}'
        f'{render_assumption_checklist(family)}'
        f'<section class="content-card prose-card"><h2>Explore this tool set</h2><p><a href="/clusters/{escape(family["cluster_slug"])}/">Open the full {escape(family["cluster_name"])} tool set</a> to move from quick estimate to deeper guidance.</p></section>'
        f'{next_step_section}'
        f'<section class="stack-grid">{faq_html}</section>'
    )


def render_calculator_page(*, slug: str, title: str, description: str, intro: str, form_html: str, result_html: str, script_name: str) -> str:
    family = family_lookup()[slug]
    key = family["key"]
    path = f"/calculators/{slug}/"
    crumbs = [("Home", "/"), ("Calculators", "/calculators/"), (title, path)]
    content = (
        f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
        f'<div class="eyebrow">{escape(family["hero_eyebrow"])}</div><h1>{escape(title)}</h1>'
        f'<p class="hero-copy">{escape(intro)}</p>'
        '<div class="hero-badges"><span class="hero-badge">Estimate range</span><span class="hero-badge">Cost breakdown</span><span class="hero-badge">Compare options</span></div></section>'
        f'{render_ad_slot(f"{key}-top")}'
        f'{render_quality_strip("calculator")}'
        f'<section class="calculator-layout"><div class="content-card calculator-card">{form_html}</div><aside class="content-card result-card">{result_html}{render_cost_intelligence_shell()}</aside></section>'
        f'{build_calculator_support(slug)}</div><script src="/assets/js/global-calculator.js"></script><script src="/assets/js/cost-intelligence.js"></script><script src="/assets/js/{escape(script_name)}"></script>'
    )
    return render_layout(
        title=f"{title} | {SITE['name']}",
        description=description,
        path=path,
        content=content,
        schema=[render_breadcrumb_schema(crumbs), render_faq_schema(family["faqs"])],
        page_type="calculator",
    )


def build_guides_index() -> tuple[str, str]:
    cards = []
    for family in get_all_calculators():
        for item in family["intent_pages"] + family["guide_pages"]:
            cards.append(
                f'<article class="tool-card"><h3><a href="/guides/{escape(item["slug"])}/">{escape(item["title"])}</a></h3><p>{escape(item["description"])}</p></article>'
            )
    path = "/guides/"
    crumbs = [("Home", "/"), ("Guides", path)]
    content = (
        f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
        '<div class="eyebrow">Guide library</div><h1>Supporting guides built around calculator intent</h1>'
        '<p class="hero-copy">These pages are written to support real estimating and buying decisions, then route users back into the right calculator or tool set.</p></section>'
        f'{render_ad_slot("guides-index-top")}'
        f'<section class="calculator-grid-section"><div class="calculator-grid">{"".join(cards)}</div></section></div>'
    )
    return path, render_layout(
        title=f'Guides | {SITE["name"]}',
        description="Browse BuildCostLab guides covering material quantities, waste, and rough cost decisions.",
        path=path,
        content=content,
        schema=[render_breadcrumb_schema(crumbs)],
        page_type="guide-index",
    )


def build_clusters_index() -> tuple[str, str]:
    seen = set()
    parts = []
    for item in get_all_calculators():
        if item["cluster_slug"] in seen:
            continue
        seen.add(item["cluster_slug"])
        parts.append(
            f'<article class="tool-card"><h3><a href="/clusters/{escape(item["cluster_slug"])}/">{escape(item["cluster_name"])}</a></h3><p>{escape(item["intro"])}</p></article>'
        )
    cards = "".join(parts)
    path = "/clusters/"
    crumbs = [("Home", "/"), ("Tool Sets", path)]
    content = (
        f'<div class="site-shell"><section class="hero hero-compact">{render_breadcrumbs(crumbs)}'
        '<div class="eyebrow">Project tool sets</div><h1>Tool sets by project type</h1>'
        '<p class="hero-copy">Browse grouped calculators and guides for painting, concrete, roofing, landscaping, flooring, and other common building jobs.</p></section>'
        f'{render_ad_slot("clusters-index-top")}'
        f'<section class="calculator-grid-section"><div class="calculator-grid">{cards}</div></section></div>'
    )
    return path, render_layout(
        title=f'Tool Sets | {SITE["name"]}',
        description="Browse BuildCostLab tool sets for calculators, guides, and next-step buying content.",
        path=path,
        content=content,
        schema=[render_breadcrumb_schema(crumbs)],
        page_type="cluster-index",
    )
