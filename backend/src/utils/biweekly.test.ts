import { computeBiweeklyRanges } from './biweekly';

function isoDay(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

describe('computeBiweeklyRanges', () => {
  it('calendar default for May 2026 → 1–15 / 16–31', () => {
    const r = computeBiweeklyRanges(5, 2026, 'calendar', null, null);
    expect(isoDay(r.q1.start)).toBe('2026-05-01');
    expect(isoDay(r.q1.end)).toBe('2026-05-15');
    expect(isoDay(r.q2.start)).toBe('2026-05-16');
    expect(isoDay(r.q2.end)).toBe('2026-05-31');
    expect(r.q1.label).toMatch(/01 may/);
    expect(r.q2.label).toMatch(/31 may/);
  });

  it('custom q1<q2 (5/20) splits inside month', () => {
    const r = computeBiweeklyRanges(5, 2026, 'custom', 5, 20);
    expect(isoDay(r.q1.start)).toBe('2026-05-05');
    expect(isoDay(r.q1.end)).toBe('2026-05-19');
    expect(isoDay(r.q2.start)).toBe('2026-05-20');
    expect(isoDay(r.q2.end)).toBe('2026-05-31');
  });

  it('custom q1>q2 (30/15) wraps from previous month', () => {
    const r = computeBiweeklyRanges(5, 2026, 'custom', 30, 15);
    expect(isoDay(r.q1.start)).toBe('2026-04-30');
    expect(isoDay(r.q1.end)).toBe('2026-05-14');
    expect(isoDay(r.q2.start)).toBe('2026-05-15');
    expect(isoDay(r.q2.end)).toBe('2026-05-29');
  });

  it('custom 30/15 in February 2026 (28 days) clamps end of Q2 to day 28', () => {
    const r = computeBiweeklyRanges(2, 2026, 'custom', 30, 15);
    expect(isoDay(r.q1.start)).toBe('2026-01-30');
    expect(isoDay(r.q1.end)).toBe('2026-02-14');
    expect(isoDay(r.q2.start)).toBe('2026-02-15');
    expect(isoDay(r.q2.end)).toBe('2026-02-28');
  });

  it('custom 31/15 in April (30 days) clamps q2 end to 30 of march', () => {
    // April has 30 days; previous month March has 31 days
    const r = computeBiweeklyRanges(4, 2026, 'custom', 31, 15);
    expect(isoDay(r.q1.start)).toBe('2026-03-31');
    expect(isoDay(r.q1.end)).toBe('2026-04-14');
    expect(isoDay(r.q2.start)).toBe('2026-04-15');
    // q2 ends at clamp(31-1, april) = clamp(30, april) = 30
    expect(isoDay(r.q2.end)).toBe('2026-04-30');
  });

  it('q1=q2 falls back to calendar', () => {
    const r = computeBiweeklyRanges(5, 2026, 'custom', 15, 15);
    expect(isoDay(r.q1.start)).toBe('2026-05-01');
    expect(isoDay(r.q2.end)).toBe('2026-05-31');
  });

  it('custom with null days falls back to calendar', () => {
    const r = computeBiweeklyRanges(5, 2026, 'custom', null, null);
    expect(isoDay(r.q1.start)).toBe('2026-05-01');
  });

  it('handles year boundary for q1>q2 in January', () => {
    const r = computeBiweeklyRanges(1, 2026, 'custom', 30, 15);
    expect(isoDay(r.q1.start)).toBe('2025-12-30');
    expect(isoDay(r.q1.end)).toBe('2026-01-14');
    expect(isoDay(r.q2.start)).toBe('2026-01-15');
    expect(isoDay(r.q2.end)).toBe('2026-01-29');
  });
});
