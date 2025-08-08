# Icon System Documentation

## Overview
EveryTriv uses a unified icon system based primarily on the `lucide-react` library, with optional support for `react-icons` when needed. This approach ensures visual consistency, improves performance through tree-shaking, and simplifies the development process.

## Icon Libraries

### Primary: lucide-react
Lucide is our primary icon library, chosen for its:
- Clean, consistent design language
- Small bundle size
- Comprehensive icon set
- TypeScript support
- Accessibility features
- Regular updates

### Secondary: react-icons
For specialized icons not available in Lucide, we use react-icons, which provides access to multiple icon sets including:
- Font Awesome
- Material Design Icons
- Bootstrap Icons
- And many more

## Usage Guidelines

### Importing Icons
All icons should be imported from our centralized icon modules:

```tsx
// For general UI icons
import { UserIcon, HomeIcon, SettingsIcon } from '@/shared/components/icons';

// For achievement-specific icons 
import { achievementIcons } from '@/shared/components/icons';
```

### Icon Props
All icons accept the following props:
- `size`: Number (default: 24)
- `color`: String (default: 'currentColor')
- `className`: String for additional styling

### Examples

#### Basic Usage
```tsx
<Button>
  <HomeIcon size={18} className="mr-2" />
  Home
</Button>
```

#### With Dynamic Icons
```tsx
const IconComponent = achievementIcons[achievement.icon];
return <IconComponent size={24} />;
```

## Icon Directory Structure

```
client/src/shared/components/icons/
├── index.ts          # Main export file for UI icons
├── achievements.ts   # Achievement-specific icons
└── categories.ts     # Category-specific icons
```

## Best Practices

1. **Consistent Sizing**:
   - Navigation icons: 24px
   - Button icons: 18px
   - Feature icons: 32px
   - Small indicators: 16px

2. **Accessibility**:
   - Always provide text alternatives when icons convey meaning
   - Use `aria-label` for icon-only buttons

3. **Performance**:
   - Import only what's needed
   - Avoid icon font libraries
   - Consider lazy-loading for rarely used icons

4. **Styling**:
   - Use CSS for coloring, not inline props
   - Match icon weight to surrounding text
   - Maintain adequate contrast ratios

## Adding New Icons

1. First check if the icon exists in lucide-react
2. If not, check react-icons libraries
3. Add the import to the appropriate file in `shared/components/icons/`
4. Export the icon with a descriptive name

## Breaking Changes & Migration

When upgrading icon libraries, check for:
- Renamed icons
- Changed default sizes
- Modified SVG paths
- New accessibility requirements

## Theming

Icons follow the application's color theme automatically via the `currentColor` value, which inherits from the parent text color. For specific theme colors, use utility classes.
