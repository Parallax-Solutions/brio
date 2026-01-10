# Theming and Internationalization

This document explains the theme system, accent color implementation, and internationalization (i18n) strategy for the Costa Rica Multi-Currency Budget App.

---

## Theme System

### Theme Options

**Supported Themes**:
- **LIGHT**: Light mode
- **DARK**: Dark mode
- **SYSTEM**: Follows user's OS preference (default)

### Implementation

**Storage**: User preference stored in database (`User.theme`)

**Default**: SYSTEM (detects OS preference on first login)

**Persistence**: 
- Stored per user in database
- Synced across devices (when user logs in)
- Falls back to localStorage for immediate UI update

### Theme Switching

**Strategy**: CSS variables + Tailwind dark mode

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 47.4% 11.2%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

**No Layout Shift**: Theme switching updates CSS variables instantly, no page reload.

**Reduced Motion**: Respects `prefers-reduced-motion` for theme transitions.

---

## Accent Color System

### Predefined Colors

**Available Accent Colors**:
- **Blue** (default)
- **Emerald** (green)
- **Violet** (purple)
- **Rose** (pink/red)
- **Amber** (orange/yellow)

**Why Predefined?**
- Ensures accessible contrast ratios
- Consistent design system
- Easier to maintain
- WCAG AA compliance guaranteed

### Implementation

**CSS Variables Approach**:

```css
/* globals.css */
:root {
  --accent: 221.2 83.2% 53.3%; /* Blue default */
}

[data-accent="emerald"] {
  --accent: 142.1 76.2% 36.3%;
}

[data-accent="violet"] {
  --accent: 262.1 83.3% 57.8%;
}

[data-accent="rose"] {
  --accent: 346.8 77.2% 49.8%;
}

[data-accent="amber"] {
  --accent: 43.3 96.4% 56.3%;
}
```

**Usage in Tailwind**:
```typescript
// Use accent color for primary actions
<button className="bg-accent text-accent-foreground">
  Save
</button>
```

**Storage**: User preference stored in database (`User.accentColor`)

**Applied To**:
- Primary buttons
- Links
- Active states
- Focus rings
- Badges (status indicators)

### Contrast Requirements

**WCAG AA Minimum**:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Foreground Contrast**:
Each accent color defines its own `--primary-foreground` to ensure proper text contrast:
- **Blue, Emerald, Violet, Rose**: White text (`0 0% 100%`)
- **Amber**: Black text (`0 0% 0%`) - lighter background requires dark text

**Testing**: All accent colors tested for contrast against light/dark backgrounds.

---

## Internationalization (i18n)

### Supported Languages

**Initial Languages**:
- **Spanish (es)**: Default (Costa Rica)
- **English (en)**: Secondary

**Locale Codes**:
- Spanish: `es-CR` (Costa Rica)
- English: `en-US` (US English)

### Implementation: next-intl

**Why next-intl**:
- Built for Next.js App Router
- Server and Client Component support
- Type-safe translations
- Locale-aware formatting

### Translation Structure

```
messages/
  en.json
  es.json
```

**Example**:
```json
// messages/es.json
{
  "dashboard": {
    "title": "Panel de Control",
    "totalIncome": "Ingresos Totales",
    "totalExpenses": "Gastos Totales"
  }
}

// messages/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "totalIncome": "Total Income",
    "totalExpenses": "Total Expenses"
  }
}
```

### Usage

**Server Components**:
```typescript
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

**Client Components**:
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

### Language Detection

**Strategy**:
1. **First Visit**: Auto-detect from browser `Accept-Language` header
2. **User Selection**: User can change in Profile
3. **Persistence**: Stored in database (`User.locale`)
4. **Fallback**: Spanish (default)

**Implementation**:
```typescript
// Middleware or layout
const locale = session?.user.locale || 
               detectLocale(request) || 
               'es';
```

---

## Locale-Aware Formatting

### Currency Formatting

**Respects Locale**:
```typescript
// Spanish (es-CR)
formatMoney(50000, 'CRC', 'es-CR') // "₡50.000"

// English (en-US)
formatMoney(50000, 'CRC', 'en-US') // "₡50,000"
```

**Currency Symbols**:
- CRC: ₡ (colón)
- USD: $ (dollar)
- CAD: CA$ or C$ (Canadian dollar)

### Date Formatting

**Locale-Aware Dates**:
```typescript
// Spanish
new Date().toLocaleDateString('es-CR') // "15/1/2024"

// English
new Date().toLocaleDateString('en-US') // "1/15/2024"
```

**Format Standards**:
- Spanish: DD/MM/YYYY
- English: MM/DD/YYYY

### Number Formatting

**Thousand Separators**:
- Spanish: Period (.) - 50.000
- English: Comma (,) - 50,000

**Decimal Separators**:
- Spanish: Comma (,) - 1.234,56
- English: Period (.) - 1,234.56

---

## User Preferences

### Profile Settings

**User Can Change**:
- Theme (light/dark/system)
- Accent color (blue/emerald/violet/rose/amber)
- Language (Spanish/English)

**Storage**:
```prisma
model User {
  theme       Theme    @default(SYSTEM)
  accentColor String   @default("blue")
  locale      String   @default("es")
}
```

**Update Flow**:
1. User changes preference in Profile
2. Server Action updates database
3. UI updates immediately (optimistic update)
4. Preference persists across sessions

---

## Accessibility Considerations

### Theme & Accessibility

**Requirements**:
- All themes meet WCAG AA contrast ratios
- Dark mode not required (user choice)
- System theme respects OS accessibility settings

**Testing**:
- Test all accent colors against light/dark backgrounds
- Verify focus states are visible in all themes
- Ensure text remains readable

### Language & Accessibility

**Requirements**:
- All UI text must be translated (no hardcoded strings)
- Screen readers announce in user's language
- Form labels and errors translated
- ARIA labels translated

**Implementation**:
- Use translation keys for all user-facing text
- Include ARIA labels in translation files
- Test with screen readers in both languages

---

## Performance

### Theme Switching

**Optimization**:
- CSS variables update instantly (no re-render)
- No layout shift
- No full page reload
- Smooth transitions (if motion allowed)

### i18n Bundle Size

**Optimization**:
- Only load translations for current locale
- Code-split translation files
- Lazy load if needed

---

## Future Extensibility

### Additional Themes

**Future Options**:
- High contrast mode
- Custom theme colors (advanced users)
- Theme presets (e.g., "Ocean", "Forest")

### Additional Languages

**Easy to Add**:
1. Create new translation file (e.g., `fr.json`)
2. Add locale to supported list
3. Update language selector
4. Test formatting

**Potential Languages**:
- French (fr)
- Portuguese (pt)
- Other Central American languages

### RTL Support

**Future Consideration**:
- If adding Arabic/Hebrew support
- Requires RTL CSS and layout adjustments
- next-intl supports RTL

---

## Testing

### Theme Testing

- Test all themes (light/dark/system)
- Test all accent colors
- Verify contrast ratios
- Test reduced motion preference
- Test theme persistence

### i18n Testing

- Test all translations exist
- Test locale-aware formatting
- Test language switching
- Test fallback to default
- Test with screen readers

---

## Summary

**Theme System**:
- Light/dark/system themes
- Database-backed persistence
- CSS variables for instant switching
- Accessible contrast ratios

**Accent Colors**:
- Predefined colors (blue, emerald, violet, rose, amber)
- CSS variable implementation
- Applied to primary UI elements
- WCAG AA compliant

**Internationalization**:
- Spanish (default) and English
- next-intl for translations
- Locale-aware formatting (currency, dates, numbers)
- Auto-detect + user selection
- Database-backed persistence

This system provides a flexible, accessible, and user-friendly theming and localization experience.


