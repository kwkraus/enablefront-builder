/**
 * Safely renders server-sanitized Series Details HTML as React nodes.
 *
 * The backend (`SeriesDetailsSanitizer`, see
 * `src/backend/Common/SeriesDetailsSanitizer.cs`) is the sole authority for
 * sanitizing series details content before persistence: it strips everything
 * down to a small allow-list (`p`, `br`, `ul`, `li`, `strong`, `em`, `u`) with
 * no attributes. This module never uses `dangerouslySetInnerHTML`. Instead it
 * tokenizes the same allow-list client-side and builds a React element tree
 * directly, so unexpected/unsupported markup can never execute or render as
 * raw HTML even if an unanticipated value ever reached the client -- it is
 * defense-in-depth, not a replacement for server-side sanitization.
 */
import { Fragment, createElement, type ReactNode } from 'react'

/** Canonical allow-listed tag names, matching the backend sanitizer's output. */
const ALLOWED_TAGS: Record<string, string> = {
  p: 'p',
  br: 'br',
  ul: 'ul',
  li: 'li',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  u: 'u',
}

/** Tags that cannot legally be nested beneath an open paragraph. */
const BLOCK_TAGS = new Set(['p', 'ul', 'li'])

/** Canonical tags that never require (or accept) children. */
const VOID_TAGS = new Set(['br'])

const TAG_PATTERN = /<(\/)?([a-zA-Z][a-zA-Z0-9]*)[^<>]*?(\/)?>/g

interface ElementNode {
  tag: string
  children: TreeNode[]
}
interface TextNode {
  text: string
}
type TreeNode = ElementNode | TextNode

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&amp;/g, '&')
}

/**
 * Tokenizes `html` into a tree restricted to `ALLOWED_TAGS`. Unsupported tags
 * are dropped (their inner text still flows through, mirroring the backend's
 * "unknown wrapper" behavior); malformed/unclosed fragments are handled
 * defensively rather than throwing.
 */
function parseSeriesDetailsHtml(html: string): TreeNode[] {
  const root: ElementNode = { tag: '#root', children: [] }
  const stack: ElementNode[] = [root]
  let lastIndex = 0

  const pushText = (raw: string) => {
    if (!raw) return
    const decoded = decodeHtmlEntities(raw)
    if (!decoded) return
    stack[stack.length - 1].children.push({ text: decoded })
  }

  for (const match of html.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0
    pushText(html.slice(lastIndex, index))
    lastIndex = index + match[0].length

    const isClosing = match[1] === '/'
    const rawName = match[2].toLowerCase()
    const isSelfClosing = Boolean(match[3]) || VOID_TAGS.has(rawName)
    const canonical = ALLOWED_TAGS[rawName]

    if (!canonical) {
      // Unknown/unsupported tag (e.g. a stray script/link/table remnant): drop
      // the tag itself; any nested text still renders as plain text.
      continue
    }

    if (isSelfClosing) {
      stack[stack.length - 1].children.push({ tag: canonical, children: [] })
      continue
    }

    if (!isClosing) {
      // Browser HTML parsing automatically closes an open paragraph before any
      // block-level tag, including another paragraph or list. Preserve that
      // normalization to avoid invalid `<p><p>` / `<p><ul>` structures.
      while (stack.length > 1 && stack[stack.length - 1]?.tag === 'p' && BLOCK_TAGS.has(canonical)) {
        stack.pop()
      }

      const node: ElementNode = { tag: canonical, children: [] }
      stack[stack.length - 1].children.push(node)
      stack.push(node)
      continue
    }

    // Closing tag: pop back to (and including) the nearest matching open
    // element. Stray closing tags with no matching open element are ignored.
    const openIndex = stack.map((n) => n.tag).lastIndexOf(canonical)
    if (openIndex > 0) {
      stack.length = openIndex
    }
  }

  pushText(html.slice(lastIndex))
  return root.children
}

function renderNodes(nodes: TreeNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    if ('text' in node) {
      return createElement(Fragment, { key }, node.text)
    }
    if (VOID_TAGS.has(node.tag)) {
      return createElement(node.tag, { key })
    }
    return createElement(node.tag, { key }, renderNodes(node.children, key))
  })
}

/**
 * Renders a sanitized series details HTML string as safe, semantic React
 * elements restricted to the shared allow-list (paragraphs, line breaks,
 * bulleted lists, bold/italic/underline). Returns `null` for empty input.
 */
export function renderSeriesDetailsHtml(html: string): ReactNode {
  if (!html) return null
  return renderNodes(parseSeriesDetailsHtml(html), 'sd')
}

/** Whether a series details value has any renderable content. */
export function hasSeriesDetails(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
