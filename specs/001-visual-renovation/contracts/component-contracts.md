# Contract: Component Interfaces

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## New Components

### Skeleton
```typescript
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'card' | 'chart';
  width?: string | number;
  height?: string | number;
  lines?: number;        // For 'text' variant
  className?: string;
}
```

### AnimatedNumber
```typescript
interface AnimatedNumberProps {
  value: number;
  duration?: number;       // ms, default 1000
  formatFn?: (n: number) => string;  // e.g., formatCurrency
  className?: string;
}
```

### Toggle
```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}
```

### BottomTabBar
```typescript
interface BottomTabBarProps {
  onAddClick: () => void;  // Opens transaction form
}
// Internal: reads current route from react-router to determine active tab
```

### PageTransition
```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}
// Wraps children in motion.div with fade+slide enter/exit
```

### AuthLayout
```typescript
interface AuthLayoutProps {
  children: React.ReactNode;   // Form content for right panel
  title: string;               // Heading above form
  subtitle?: string;           // Subtext below heading
}
// Renders split-screen on desktop, stacked on mobile
```

### ChartTooltip
```typescript
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatValue?: (value: number) => string;
}
```

## Modified Components (Interface Changes)

### Sidebar
```typescript
// New prop added:
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}
```

### Card
```typescript
// New variants added:
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'stat' | 'interactive';
  className?: string;
  animate?: boolean;  // Enable entrance animation
}
```

### Button
```typescript
// New variant added:
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;    // Shows spinner, disables click
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  // ...extends ButtonHTMLAttributes
}
```

### EmptyState
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### ProgressBar
```typescript
interface ProgressBarProps {
  value: number;         // 0-100
  max?: number;
  animated?: boolean;    // Animate from 0 on mount
  showLabel?: boolean;
  thresholdColors?: boolean;  // green/amber/red based on %
  className?: string;
}
```

## Page Layout Contracts

### Authenticated Pages
All authenticated pages follow this structure:
1. `MainLayout` wraps page content (sidebar + header + content area)
2. `PageTransition` wraps the page's root content
3. Page-specific content renders inside the transition wrapper

### Auth Pages
All auth pages follow this structure:
1. `AuthLayout` wraps the form
2. No sidebar, no header, no bottom tabs
3. Full viewport height

### Mobile Breakpoint (<640px)
1. Sidebar hidden
2. BottomTabBar visible (fixed bottom)
3. Content area has bottom padding to account for tab bar height (64px + safe area)
4. Header simplified (no search, just logo + avatar)
