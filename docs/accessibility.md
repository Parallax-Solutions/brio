# Accessibility

This document outlines the accessibility (a11y) principles, WCAG alignment, and testing checklist for the Costa Rica Multi-Currency Budget App.

---

## WCAG 2.1 AA Compliance

**Target**: Meet WCAG 2.1 Level AA standards (minimum requirement)

**Why AA?**
- Legal compliance in many jurisdictions
- Best practice for web applications
- Ensures usability for users with disabilities
- Improves overall user experience

---

## Core Principles

### 1. Perceivable

**Text Alternatives**:
- All images have `alt` text
- Icons have accessible labels (when not decorative)
- Decorative images have empty `alt=""`

**Color Contrast**:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum
- All accent colors tested for contrast

**Text Resizing**:
- Text can be resized up to 200% without loss of functionality
- No horizontal scrolling required
- Layout remains usable

### 2. Operable

**Keyboard Navigation**:
- All interactive elements keyboard accessible
- Logical tab order
- No keyboard traps
- Skip links for main content

**Focus Management**:
- Visible focus indicators on all interactive elements
- Focus order follows visual order
- Focus not lost during interactions
- Focus returns to logical place after modal closes

**Time Limits**:
- No time limits on user input
- Sessions don't expire unexpectedly
- User can extend time if needed (future)

**Seizures**:
- No flashing content (no content flashes more than 3 times per second)

### 3. Understandable

**Language**:
- Page language declared (`<html lang="es">` or `lang="en"`)
- Language changes announced to screen readers
- Technical terms explained where needed

**Consistent Navigation**:
- Navigation structure consistent across pages
- Repeated components appear in same order
- Labels consistent (e.g., "Save" not "Submit" in one place, "Save" in another)

**Error Identification**:
- Errors clearly identified
- Error messages descriptive
- Errors associated with form fields
- Required fields clearly marked

**Input Assistance**:
- Labels for all form inputs
- Instructions provided where needed
- Error prevention (validation before submit)
- Confirmation for destructive actions

### 4. Robust

**Markup**:
- Valid HTML
- Semantic HTML elements (`<nav>`, `<main>`, `<button>`, etc.)
- Proper heading hierarchy (h1 → h2 → h3)

**Screen Readers**:
- ARIA labels where needed
- ARIA roles for custom components
- Live regions for dynamic content updates
- Status messages announced

---

## Implementation Guidelines

### Semantic HTML

**Use Proper Elements**:
```html
<!-- ✅ Good -->
<button>Save</button>
<nav>...</nav>
<main>...</main>
<form>...</form>

<!-- ❌ Bad -->
<div onClick={...}>Save</div>
<div className="nav">...</div>
```

### ARIA Labels

**When to Use**:
- Icon-only buttons
- Custom components
- Complex interactions
- Status messages

**Examples**:
```tsx
// Icon button
<button aria-label="Close dialog">
  <XIcon />
</button>

// Status message
<div role="status" aria-live="polite">
  Expense saved successfully
</div>
```

### Form Accessibility

**Required Elements**:
- `<label>` for every input
- `aria-required` for required fields
- `aria-invalid` for error states
- Error messages linked with `aria-describedby`

**Example**:
```tsx
<label htmlFor="amount">Amount</label>
<input
  id="amount"
  type="number"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "amount-error" : undefined}
/>
{hasError && (
  <div id="amount-error" role="alert">
    Amount is required
  </div>
)}
```

### Keyboard Navigation

**Tab Order**:
- Logical visual order
- Skip links for main content
- Focus trapped in modals
- Focus returns after modal closes

**Keyboard Shortcuts** (Future):
- `Esc` to close dialogs
- `Enter` to submit forms
- Arrow keys for navigation (where appropriate)

### Focus Management

**Visible Focus**:
- Clear focus indicators (not just outline)
- High contrast focus rings
- Focus visible in all themes

**Focus States**:
```css
/* Tailwind focus-visible */
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Color and Meaning

**Don't Rely on Color Alone**:
- Use icons + color for status (paid/unpaid)
- Use text labels in addition to color
- Ensure information conveyed by color is also conveyed by other means

**Example**:
```tsx
// ✅ Good: Icon + color + text
<Badge variant="success">
  <CheckIcon /> Paid
</Badge>

// ❌ Bad: Color only
<Badge className="bg-green-500">Status</Badge>
```

---

## Component-Specific Guidelines

### Buttons

**Requirements**:
- Descriptive text or `aria-label`
- Keyboard accessible
- Visible focus state
- Loading states announced

**Example**:
```tsx
<button
  aria-label={isLoading ? "Saving expense..." : "Save expense"}
  disabled={isLoading}
>
  {isLoading ? "Saving..." : "Save"}
</button>
```

### Dialogs/Modals

**Requirements**:
- Focus trapped inside modal
- Focus returns to trigger after close
- `Esc` key closes modal
- `aria-modal="true"`
- `aria-labelledby` or `aria-label`

**Example**:
```tsx
<Dialog>
  <DialogContent aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Add Expense</DialogTitle>
    {/* ... */}
  </DialogContent>
</Dialog>
```

### Tables

**Requirements**:
- `<caption>` or `aria-label` for table purpose
- `<th>` with `scope` attribute
- Headers associated with cells
- Sortable columns announced

**Example**:
```tsx
<table aria-label="Monthly expenses">
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Amount</th>
    </tr>
  </thead>
  <tbody>
    {/* ... */}
  </tbody>
</table>
```

### Forms

**Requirements**:
- All inputs have labels
- Required fields marked
- Error messages associated with fields
- Success messages announced
- Validation on blur and submit

### Navigation

**Requirements**:
- Skip link to main content
- Current page indicated (aria-current)
- Keyboard accessible
- Focus visible

---

## Testing Checklist

### Automated Testing

- [ ] **axe-core**: Run accessibility audit
- [ ] **Lighthouse**: Accessibility score 90+
- [ ] **WAVE**: Web accessibility evaluation
- [ ] **ESLint a11y plugin**: Catch common issues

### Manual Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify logical tab order
- [ ] Test all functionality with keyboard only
- [ ] Verify focus indicators visible
- [ ] Test modal focus trapping
- [ ] Test `Esc` closes dialogs

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Verify all content announced
- [ ] Verify form labels read correctly
- [ ] Verify error messages announced
- [ ] Verify status updates announced

#### Visual Testing
- [ ] Test with browser zoom at 200%
- [ ] Test with high contrast mode
- [ ] Test color contrast ratios
- [ ] Test in light and dark themes
- [ ] Verify no information lost in grayscale

#### Form Testing
- [ ] All inputs have visible labels
- [ ] Required fields clearly marked
- [ ] Error messages descriptive
- [ ] Errors associated with fields
- [ ] Success messages clear

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## Tools and Resources

### Testing Tools
- **axe DevTools**: Browser extension
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Pa11y**: Command-line accessibility testing

### Screen Readers
- **NVDA**: Free, Windows
- **JAWS**: Paid, Windows
- **VoiceOver**: Built into macOS/iOS
- **TalkBack**: Built into Android

### Color Contrast
- **WebAIM Contrast Checker**: Verify contrast ratios
- **Colour Contrast Analyser**: Desktop tool

---

## Common Issues and Fixes

### Issue: Missing Alt Text
**Fix**: Add descriptive `alt` text or `aria-label`

### Issue: Low Contrast
**Fix**: Adjust colors to meet 4.5:1 ratio

### Issue: Missing Labels
**Fix**: Add `<label>` or `aria-label` to all inputs

### Issue: Keyboard Traps
**Fix**: Ensure focus can escape modals, use focus management

### Issue: Color-Only Indicators
**Fix**: Add icons or text labels in addition to color

---

## Future Enhancements

### Advanced Features
- [ ] Skip links for main content
- [ ] Keyboard shortcuts documentation
- [ ] High contrast mode option
- [ ] Font size adjustment
- [ ] Reduced motion preference support

### Testing
- [ ] Automated a11y tests in CI/CD
- [ ] Regular manual testing with screen readers
- [ ] User testing with people with disabilities

---

## Summary

**Compliance**: WCAG 2.1 AA (minimum)

**Key Principles**:
1. Perceivable: Text alternatives, contrast, resizable text
2. Operable: Keyboard navigation, focus management, no time limits
3. Understandable: Clear language, consistent navigation, error help
4. Robust: Valid markup, semantic HTML, screen reader support

**Implementation**:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Visible focus states
- Color + other indicators
- Form accessibility

**Testing**:
- Automated tools (axe, Lighthouse)
- Manual keyboard testing
- Screen reader testing
- Visual testing (zoom, contrast)

This ensures the app is accessible to all users, regardless of abilities.


