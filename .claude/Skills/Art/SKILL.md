---
name: Art
description: Complete visual content system for PAI. Tron-meets-Excalidraw aesthetic - dark backgrounds, neon accents, hand-drawn sketch style. USE WHEN user wants to create visual content, illustrations, diagrams, header images, visualizations, mermaid flowcharts, technical diagrams, OR any visual request.
---

# Art Skill

Complete visual content system using the **PAI Visual Aesthetic**.

---

## Core Aesthetic

**Tron-meets-Excalidraw** - Digital warmth combining:
- Hand-drawn Excalidraw-style sketch lines (NOT clean vectors)
- Dark slate backgrounds for modern contrast
- Neon orange (warmth) + cyan (tech) accents
- Subtle glows on key elements

**Full aesthetic documentation:** `${PAI_DIR}/Skills/CORE/aesthetic.md`

**This is the SINGLE SOURCE OF TRUTH for all visual styling.**

---

## Workflow Routing

| Content Type | Workflow |
|--------------|----------|
| Blog headers / Editorial | `workflows/workflow.md` |
| Adaptive orchestrator | `workflows/visualize.md` |
| Flowcharts / Sequences | `workflows/mermaid.md` |
| Architecture diagrams | `workflows/technical-diagrams.md` |
| Classification grids | `workflows/taxonomies.md` |
| Chronological | `workflows/timelines.md` |
| 2x2 matrices | `workflows/frameworks.md` |
| X vs Y | `workflows/comparisons.md` |
| Screenshot markup | `workflows/annotated-screenshots.md` |
| Step-by-step | `workflows/recipe-cards.md` |
| Quote cards | `workflows/aphorisms.md` |
| Idea territories | `workflows/maps.md` |
| Big numbers | `workflows/stats.md` |
| Sequential panels | `workflows/comics.md` |

---

## Image Generation

**Default model:** nano-banana-pro (Gemini 3 Pro)

```bash
bun run ${PAI_DIR}/Skills/art/tools/generate-ulart-image.ts \
  --model nano-banana-pro \
  --prompt "[PROMPT]" \
  --size 2K \
  --aspect-ratio 1:1 \
  --output /path/to/output.png
```

### Alternative Models

| Model | When to Use |
|-------|-------------|
| **flux** | Maximum quality |
| **gpt-image-1** | Different interpretation |

**API keys in:** `${PAI_DIR}/.env`
- `REPLICATE_API_TOKEN` - Flux and Nano Banana
- `OPENAI_API_KEY` - GPT-image-1
- `GOOGLE_API_KEY` - Nano Banana Pro
- `REMOVEBG_API_KEY` - Background removal

---

## Quick Decision Tree

```
What does user need?

├─ Unsure which approach? → VISUALIZE (analyzes & orchestrates)
├─ Flowchart/sequence/state diagram? → MERMAID
├─ Abstract metaphor for article? → Editorial (workflow.md)
├─ System/architecture with labels? → Technical Diagram
├─ Categories in grid? → Taxonomy
├─ Change over time? → Timeline
├─ 2x2 matrix or mental model? → Framework
├─ Side-by-side contrast? → Comparison
├─ Markup existing screenshot? → Annotated Screenshot
├─ Step-by-step process? → Recipe Card
├─ Quote as social visual? → Aphorism
├─ Idea territories as map? → Conceptual Map
├─ Single striking number? → Stat Card
└─ Multi-panel story? → Comic
```

---

## Examples

**Example 1: Blog Header Image**
```
User: "Create a header image for my article about AI agents"
→ Invokes Editorial workflow (workflows/workflow.md)
→ Applies Tron-meets-Excalidraw aesthetic
→ Generates image with dark background, neon accents
→ Returns header image ready for blog
```

**Example 2: Technical Architecture Diagram**
```
User: "Create an architecture diagram for my microservices system"
→ Invokes Technical Diagrams workflow (workflows/technical-diagrams.md)
→ Uses hand-drawn sketch style with labeled components
→ Returns diagram with system components and connections
```

**Example 3: Mermaid Flowchart**
```
User: "Create a flowchart showing the user authentication flow"
→ Invokes Mermaid workflow (workflows/mermaid.md)
→ Generates mermaid code for the flow
→ Returns both code and rendered visualization
```

---

**For complete visual styling rules, ALWAYS read:** `${PAI_DIR}/Skills/CORE/aesthetic.md`
