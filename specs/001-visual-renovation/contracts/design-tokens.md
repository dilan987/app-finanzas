# Contract: Design Tokens

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## Color Tokens

### Primary Scale (Blue)
| Token | Light Mode | Dark Mode |
|---|---|---|
| primary-50 | #eff6ff | #eff6ff |
| primary-100 | #dbeafe | #dbeafe |
| primary-200 | #bfdbfe | #bfdbfe |
| primary-300 | #93c5fd | #93c5fd |
| primary-400 | #60a5fa | #60a5fa |
| primary-500 | #3b82f6 | #3b82f6 |
| primary-600 | #2563eb | #2563eb |
| primary-700 | #1d4ed8 | #1d4ed8 |
| primary-800 | #1e40af | #1e40af |
| primary-900 | #1e3a8a | #1e3a8a |
| primary-950 | #172554 | #172554 |

### Semantic Colors
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| income | #059669 | #34d399 | Income amounts, positive indicators |
| income-bg | #ecfdf5 | rgba(5,150,105,0.1) | Income badge/card backgrounds |
| expense | #ef4444 | #f87171 | Expense amounts, negative indicators |
| expense-bg | #fef2f2 | rgba(239,68,68,0.1) | Expense badge/card backgrounds |
| invest | #8b5cf6 | #a78bfa | Investment indicators |
| invest-bg | #f5f3ff | rgba(139,92,246,0.1) | Investment backgrounds |
| warning | #f59e0b | #fbbf24 | Budget limits, alerts |
| warning-bg | #fffbeb | rgba(245,158,11,0.1) | Warning backgrounds |

### Surface Colors
| Token | Light Mode | Dark Mode |
|---|---|---|
| bg-primary | #ffffff | #0f172a |
| bg-secondary | #f8fafc | #1e293b |
| bg-tertiary | #f1f5f9 | #334155 |
| surface-card | #ffffff | #1e293b |
| surface-card-hover | #f8fafc | #334155 |
| border-primary | #e2e8f0 | #334155 |
| border-secondary | #cbd5e1 | #475569 |

### Text Colors
| Token | Light Mode | Dark Mode |
|---|---|---|
| text-primary | #0f172a | #f8fafc |
| text-secondary | #475569 | #94a3b8 |
| text-tertiary | #94a3b8 | #64748b |
| text-inverse | #f8fafc | #0f172a |

## Typography Tokens

| Token | Value |
|---|---|
| font-family | 'Inter', system-ui, -apple-system, sans-serif |
| font-size-xs | 0.75rem (12px) |
| font-size-sm | 0.875rem (14px) |
| font-size-base | 1rem (16px) |
| font-size-lg | 1.125rem (18px) |
| font-size-xl | 1.25rem (20px) |
| font-size-2xl | 1.5rem (24px) |
| font-size-3xl | 2rem (32px) |
| font-size-4xl | 2.5rem (40px) |
| font-weight-normal | 400 |
| font-weight-medium | 500 |
| font-weight-semibold | 600 |
| font-weight-bold | 700 |
| line-height-tight | 1.2 |
| line-height-snug | 1.375 |
| line-height-normal | 1.5 |
| line-height-relaxed | 1.625 |

## Spacing Tokens

Base unit: 4px. All spacing derives from this.

| Token | Value |
|---|---|
| space-1 | 0.25rem (4px) |
| space-2 | 0.5rem (8px) |
| space-3 | 0.75rem (12px) |
| space-4 | 1rem (16px) |
| space-5 | 1.25rem (20px) |
| space-6 | 1.5rem (24px) |
| space-8 | 2rem (32px) |
| space-10 | 2.5rem (40px) |
| space-12 | 3rem (48px) |

## Shadow Tokens

| Token | Light Mode | Dark Mode |
|---|---|---|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.05) | 0 1px 2px rgba(0,0,0,0.3) |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | 0 1px 3px rgba(0,0,0,0.4) |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) | 0 4px 6px rgba(0,0,0,0.4) |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | 0 10px 15px rgba(0,0,0,0.5) |
| shadow-card | 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) | 0 0 0 1px rgba(255,255,255,0.05) |
| shadow-card-hover | 0 4px 12px rgba(0,0,0,0.1) | 0 4px 12px rgba(0,0,0,0.4) |

## Border Radius Tokens

| Token | Value |
|---|---|
| radius-sm | 0.375rem (6px) |
| radius-md | 0.5rem (8px) |
| radius-lg | 0.75rem (12px) |
| radius-xl | 1rem (16px) |
| radius-2xl | 1.5rem (24px) |
| radius-full | 9999px |

## Animation Tokens

| Token | Value |
|---|---|
| duration-fast | 150ms |
| duration-normal | 200ms |
| duration-slow | 300ms |
| duration-chart | 500ms |
| ease-default | cubic-bezier(0.4, 0, 0.2, 1) |
| ease-in | cubic-bezier(0.4, 0, 1, 1) |
| ease-out | cubic-bezier(0, 0, 0.2, 1) |
| ease-bounce | cubic-bezier(0.34, 1.56, 0.64, 1) |

## Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| z-base | 0 | Default content |
| z-dropdown | 10 | Dropdown menus |
| z-sticky | 20 | Sticky elements |
| z-header | 30 | Fixed header |
| z-sidebar | 40 | Sidebar overlay |
| z-bottom-tabs | 40 | Mobile bottom tabs |
| z-modal-backdrop | 45 | Modal background |
| z-modal | 50 | Modal content |
| z-toast | 60 | Toast notifications |

## Chart Colors (Consistent Sequence)

| Index | Color | Usage |
|---|---|---|
| 0 | #3b82f6 | Primary series, default |
| 1 | #22c55e | Income, positive |
| 2 | #ef4444 | Expenses, negative |
| 3 | #8b5cf6 | Investments |
| 4 | #f59e0b | Warning, secondary |
| 5 | #06b6d4 | Savings, tertiary |
