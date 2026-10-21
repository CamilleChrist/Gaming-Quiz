---

paths:

  - 'src/**/*.vue'
  - 'src/**/*.css'

---

# CSS

## Tailwind

Use [Tailwind CSS](https://tailwindcss.com/) for all styling.

* Style components with Tailwind utility classes in the template.
* Do not write custom CSS when a utility class does the job.
* Do not add `<style>` blocks to components unless Tailwind cannot express the style (for example a custom `@keyframes`).
* Do not add another CSS framework or component library (daisyUI, Bootstrap, etc.) without the user's approval.

## Theme

Colors, fonts and other design tokens live in the `@theme` block of `src/assets/main.css`.

* Use theme tokens (`bg-night`, `text-pink`, `border-electric`) instead of hard-coded values.
* Do not use arbitrary values (`bg-[#ff3d8b]`) or inline `style` attributes for colors.
* To add or change a color, edit `@theme`, not the components.

## Layout

* Build mobile-first: write the base classes for small screens, then add `sm:`, `md:`, `lg:` variants.
* Keep accessibility in mind: visible focus states (`focus-visible:`), sufficient text contrast.

## Animations

* Prefer Tailwind utilities (`transition`, `duration-*`, `animate-*`).
* Define custom animations in `src/assets/main.css`, not in components.
* Do not add an animation library without the user's approval.
