# Contract: Animation Specifications

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## Page Transitions (FR-008)

**Trigger**: Route change within authenticated area  
**Animation**:
```
Enter: opacity 0→1, y 10→0, duration 200ms, ease-out
Exit: opacity 1→0, duration 150ms, ease-in
Mode: "wait" (exit completes before enter starts)
```
**Reduced motion**: Instant transition (no animation)

## Card Entrance Animations (FR-009)

**Trigger**: Page mount / data load  
**Animation**:
```
Enter: opacity 0→1, y 20→0, duration 300ms, ease-out
Stagger: 50ms delay between siblings
```
**Reduced motion**: Instant appear (opacity only, no movement)

## Card Hover Depth (FR-009)

**Trigger**: Mouse hover on interactive cards  
**Animation**:
```
Hover: translateY -2px, shadow-card → shadow-card-hover, duration 150ms
```
**Reduced motion**: No transform, subtle background change only

## Number Count-Up (Dashboard)

**Trigger**: Balance/stat data loads  
**Animation**:
```
Count from 0 to target value over 1000ms
Easing: ease-out (fast start, slow finish)
Format applied at each frame
```
**Reduced motion**: Show final value immediately

## Progress Bar Fill (FR-012)

**Trigger**: Budget data loads  
**Animation**:
```
Width: 0% → actual%, duration 600ms, ease-out
Color applied statically (no color transition)
```
**Reduced motion**: Show at final width immediately

## Chart Draw-In (FR-006)

**Trigger**: Chart component mounts with data  
**Animation**:
```
Recharts built-in: isAnimationActive=true, animationDuration=500, animationEasing="ease-out"
```
**Reduced motion**: `isAnimationActive=false`

## Theme Toggle (FR-002)

**Trigger**: User toggles light/dark mode  
**Animation**:
```
CSS transition on background-color, color, border-color, box-shadow: 200ms ease
Applied via transition utility on body/root element
```
**Reduced motion**: Instant switch

## Modal Enter/Exit

**Trigger**: Modal open/close  
**Animation**:
```
Backdrop: opacity 0→1, duration 200ms
Content: opacity 0→1, scale 0.95→1, duration 200ms, ease-out
Exit: reverse of enter, duration 150ms
```
**Reduced motion**: Instant appear/disappear

## Sidebar Collapse (FR-003)

**Trigger**: User clicks collapse toggle  
**Animation**:
```
Width: 260px→64px (or reverse), duration 200ms, ease-default
Labels: opacity 1→0 (or reverse), duration 150ms
Content area: adjusts width simultaneously
```
**Reduced motion**: Instant resize

## Bottom Tab Bar "More" Sheet

**Trigger**: User taps "More" tab on mobile  
**Animation**:
```
Sheet slides up from bottom: y 100%→0, duration 300ms, ease-out
Backdrop: opacity 0→0.5, duration 200ms
Exit: reverse
```
**Reduced motion**: Instant appear/disappear

## Skeleton Pulse

**Trigger**: Data loading state  
**Animation**:
```
CSS: Tailwind animate-pulse (opacity oscillation)
Background: bg-tertiary with pulse
```
**Reduced motion**: Static gray block (no pulse)

## Global Animation Rules

1. All animations MUST check `prefers-reduced-motion` via Framer Motion's `useReducedMotion()` hook or CSS media query
2. No animation exceeds 600ms duration
3. No animation uses spring physics (keep financial context calm/trustworthy)
4. Stagger delays never exceed 50ms × item count
5. All exit animations are ≤ enter animation duration
