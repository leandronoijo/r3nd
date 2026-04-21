```markdown
# Design System Strategy: The Kinetic Void

## 1. Overview & Creative North Star
**Creative North Star: The Kinetic Void**
This design system is built for high-performance tech frameworks where speed, power, and sophistication are paramount. We are moving away from the "SaaS template" look. Instead, we embrace a "Kinetic Void" aesthetic—a deep, expansive foundation of `surface-dim` punctuated by high-energy, electric accents. 

The layout should feel like a high-end editorial spread: intentional asymmetry, overlapping elements that break the container, and a typography scale that values massive negative space. We are not just building an interface; we are building a developer's command center.

## 2. Colors & Surface Logic
The palette is rooted in deep space, utilizing high-contrast accents to guide the eye toward critical actions and data points.

### The "No-Line" Rule
Standard 1px solid borders for sectioning are strictly prohibited. They clutter the UI and break the immersion. Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large structural areas sitting on `surface-dim`, and `surface-container-high` for nested content.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of glass and light.
*   **Level 0 (Foundation):** `surface-dim` (#070d1f).
*   **Level 1 (Sections):** `surface-container-low` (#0c1326).
*   **Level 2 (Cards/Modules):** `surface-container` (#11192e).
*   **Level 3 (Popovers/Modals):** `surface-container-highest` (#1c253e).

### The "Glass & Gradient" Rule
To achieve the "wow" factor, use glassmorphism for floating elements. 
*   **Recipe:** `surface-variant` at 60% opacity + 24px `backdrop-filter: blur()`.
*   **Signature Textures:** For primary CTAs or Hero backgrounds, utilize a linear mesh gradient transitioning from `primary` (#3adffa) to `secondary` (#ac8aff) at a 135-degree angle. This provides a "soul" to the interface that flat colors cannot replicate.

## 3. Typography
Our typography is the backbone of the "Editorial" feel. It balances raw technical precision with bold, aggressive headings.

*   **Display & Headlines (Space Grotesk):** Use for high-impact messaging. Set with **tight tracking (-0.02em to -0.05em)**. This font is a geometric powerhouse; it should feel architectural.
*   **Body & Labels (Inter):** The workhorse for code snippets and documentation. It provides the necessary legibility to balance the aggressive headings.
*   **Visual Hierarchy:** Don't be afraid of the extremes. Use `display-lg` (3.5rem) immediately adjacent to `label-sm` (0.6875rem) to create a sophisticated, high-fidelity contrast.

## 4. Elevation & Depth
In this system, depth is a function of light and transparency, not "structural" shadows.

*   **Tonal Layering:** Depth is achieved by "stacking" the surface tiers. A `surface-container-highest` card placed on a `surface-container-low` section creates a natural lift.
*   **Ambient Shadows:** When an element must float (e.g., a dropdown), use an extra-diffused shadow. 
    *   *Shadow Property:* `0 20px 40px rgba(0, 0, 0, 0.4)`. 
    *   *Tinting:* Incorporate a 4% tint of the `primary` color into the shadow to mimic the glow of a neon light source.
*   **The Ghost Border:** If a boundary is required for accessibility, use a "Ghost Border." Apply the `outline-variant` token at **15% opacity**. This creates a hint of a sharp edge without closing off the layout.

## 5. Components

### Buttons
*   **Primary:** A gradient-filled container (`primary` to `primary-container`). Text is `on-primary` (#004b56). Use `md` (0.375rem) corner radius for a sharp, modern feel.
*   **Secondary:** No fill. Use a `Ghost Border` and `primary` colored text.
*   **Tertiary:** Text only in `secondary` (#ac8aff), with an underline that appears only on hover.

### Input Fields
Avoid the "box" look. 
*   **Style:** `surface-container-highest` background with a 1px `Ghost Border`. 
*   **Focus State:** The border opacity increases to 100% `primary` with a subtle 4px outer glow (neon effect).
*   **Error:** Use `error` (#ff716c) for the text and a soft `error_container` glow.

### Cards & Modules
*   **Constraint:** Never use divider lines. 
*   **Separation:** Use 32px or 48px of vertical white space from our spacing scale to separate content blocks. 
*   **Interaction:** On hover, a card should shift from `surface-container` to `surface-container-high` and slightly scale (1.02x) to feel responsive.

### Glass Tooltips
*   **Style:** `surface-variant` at 80% opacity, `backdrop-blur: 12px`, and a 1px `Ghost Border`. This ensures the tooltip feels like it belongs to a higher atmospheric layer.

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Place a `display-md` headline on the left and a small `body-sm` paragraph on the far right. Use the "void" to create tension.
*   **Use Neon Sparingly:** Only use `primary` and `secondary` glows for interactive elements or status indicators.
*   **Nesting Surfaces:** Always ensure that nested containers are lighter (higher tier) than their parent containers to maintain logical light depth.

### Don't:
*   **Don't Use Pure White:** For text, use `on-surface` (#dfe4fe). Pure white (#ffffff) is too harsh against `surface-dim` and causes visual vibration.
*   **Don't Use Default Shadows:** Standard grey shadows look "dirty" on deep black backgrounds. Always tint shadows or use tonal shifts.
*   **Don't Box Everything In:** Let elements bleed. If you have a code snippet, let it run to the edge of the screen or container to emphasize the "infinite" feel of the framework.

---
**Director's Note:** This system is about the balance between the "Quiet" (the dark void) and the "Loud" (the neon typography). If everything glows, nothing glows. Use the deep surfaces to make the cyan and violet moments feel like events.```