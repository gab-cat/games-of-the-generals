<!-- 13e488ec-7d3f-43bc-a0fb-571b62b7b5f4 7c2ffc56-7a22-4487-a2bd-ef60dd685d72 -->
# SEO Structured Data Enhancement Plan

## Current State Analysis

The `index.html` file currently has:

- Basic VideoGame schema with minimal properties
- Standard meta tags for OG and Twitter
- Domain inconsistency (twitter:url uses wrong domain)
- Missing advanced SEO features

## Proposed Enhancements

### 1. Fix Domain Inconsistency

Update line 49 to use `generalsonline.app` instead of `gamesofthegenerals.app`

### 2. Expand Structured Data with @graph Array

Replace the single VideoGame schema (lines 84-111) with a comprehensive @graph array containing multiple schema types:

**a) Organization Schema**

- Add organization details with logo, contact information
- Include sameAs array for social media profiles (structure ready for future URLs)
- Add foundingDate and description

**b) WebSite Schema**

- Add WebSite type with name and url
- Include potentialAction for SearchAction (enables sitelinks search box)
- Add inLanguage property

**c) Enhanced VideoGame Schema**

- Add screenshot property with ImageObject array (reference existing screenshots)
- Include contentRating (e.g., "ESRB Everyone")
- Add numberOfPlayers (e.g., "2")
- Include gameLocation as "Online"
- Add gamePlatform details
- Include publisher reference to Organization
- Add datePublished and dateModified
- Include inLanguage
- Add url property pointing to canonical URL
- Expand playMode with more specific values
- Add applicationCategory and applicationSubCategory
- Include operatingSystem details
- Add accessMode and accessibilityFeatures for accessibility SEO

**d) WebApplication Schema**

- Add WebApplication type (games are web apps)
- Include browserRequirements
- Add softwareVersion
- Include offers with detailed pricing info
- Add applicationCategory
- Include screenshot references

**e) BreadcrumbList Schema**

- Add breadcrumb navigation structure
- Include Home > Game as basic structure
- Helps Google understand site hierarchy

### 3. Add Advanced Meta Tags

**Performance & Resource Hints:**

- Add dns-prefetch for fonts.googleapis.com and fonts.gstatic.com
- Add preconnect hints (already present, keep them)
- Add preload hint for critical CSS
- Add modulepreload for main.tsx

**Additional SEO Meta Tags:**

- Add format-detection meta tag
- Add referrer policy
- Add color-scheme meta tag
- Add mobile-web-app-capable enhancements

**Enhanced Open Graph:**

- Add og:image:alt for accessibility
- Add og:image:type
- Add article:published_time
- Add article:modified_time
- Add og:see_also for related content

**Enhanced Twitter Card:**

- Add twitter:image:alt
- Add twitter:site handle (structure ready)
- Add twitter:creator handle (structure ready)

### 4. Add Alternate and Language Tags

- Add hreflang="en" for current English version
- Add hreflang="x-default" pointing to main domain
- Structure ready for future multilingual expansion

### 5. Enhanced Structured Data Properties

Add these properties to make the schema more comprehensive:

- featureList for game features
- screenshot array with proper ImageObject schema
- video property (structure ready for future trailer)
- interactionStatistic for engagement metrics
- review/aggregateRating enhancement with reviewCount
- potentialAction for PlayAction

## Implementation Details

The structured data will use JSON-LD format with @graph array to include multiple schema types in a single script tag. This approach:

- Is recommended by Google for multiple schema types
- Keeps the code organized and maintainable
- Allows proper entity relationships
- Improves rich results eligibility

All URLs will consistently use `https://generalsonline.app` as the primary domain.

## Expected SEO Benefits

1. Enhanced rich snippets in search results
2. Eligibility for Google's sitelinks search box
3. Better understanding of content by search engines
4. Improved accessibility signals
5. Enhanced social media previews
6. Better mobile search performance
7. Increased click-through rates from search results
8. Potential for game-specific rich results
9. Improved local and international SEO signals
10. Better crawl efficiency with resource hints