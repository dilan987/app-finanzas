import { TransactionType, Severity } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import {
  getMonthRange,
  getPreviousMonth,
  calcPercentChange,
  calcSavingsRate,
  formatCurrencyShort,
  toNumber,
} from '../../utils/helpers';

// ── Types ──────────────────────────────────────────────────────────

interface MonthlyTotals {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

interface Recommendation {
  message: string;
  severity: Severity;
  category: string;
}

// ── Shared Data Fetching ───────────────────────────────────────────

async function getMonthTotals(userId: string, month: number, year: number): Promise<MonthlyTotals> {
  const { start, end } = getMonthRange(month, year);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.INCOME, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = toNumber(incomeResult._sum.amount);
  const totalExpenses = toNumber(expenseResult._sum.amount);

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    savingsRate: calcSavingsRate(totalIncome, totalExpenses),
  };
}

// ── Public API ─────────────────────────────────────────────────────

export async function getFinancialSummary(userId: string, month: number, year: number) {
  const prev = getPreviousMonth(month, year);
  const [current, previous] = await Promise.all([
    getMonthTotals(userId, month, year),
    getMonthTotals(userId, prev.month, prev.year),
  ]);

  return {
    month,
    year,
    ...current,
    previousMonth: previous,
    comparison: {
      incomeChange: calcPercentChange(current.totalIncome, previous.totalIncome),
      expenseChange: calcPercentChange(current.totalExpenses, previous.totalExpenses),
      balanceChange: calcPercentChange(current.balance, previous.balance),
      savingsRateChange: Math.round((current.savingsRate - previous.savingsRate) * 100) / 100,
    },
  };
}

export async function getCategoryBreakdown(userId: string, month: number, year: number) {
  const { start, end } = getMonthRange(month, year);
  const prev = getPreviousMonth(month, year);
  const prevRange = getMonthRange(prev.month, prev.year);

  const [currentExpenses, previousExpenses] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: TransactionType.EXPENSE, date: { gte: prevRange.start, lte: prevRange.end } },
      _sum: { amount: true },
    }),
  ]);

  const totalExpenses = currentExpenses.reduce((sum, item) => sum + toNumber(item._sum.amount), 0);
  const previousMap = new Map(
    previousExpenses.filter((i) => i.categoryId).map((i) => [i.categoryId!, toNumber(i._sum.amount)]),
  );

  const withCategory = currentExpenses.filter((item): item is typeof item & { categoryId: string } => item.categoryId !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: withCategory.map((i) => i.categoryId) } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return withCategory
    .map((item) => {
      const totalSpent = toNumber(item._sum.amount);
      const cat = categoryMap.get(item.categoryId);
      const prev = previousMap.get(item.categoryId) ?? 0;
      return {
        categoryId: item.categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        categoryIcon: cat?.icon ?? 'tag',
        categoryColor: cat?.color ?? '#6B7280',
        totalSpent,
        percentage: totalExpenses > 0 ? Math.round((totalSpent / totalExpenses) * 10000) / 100 : 0,
        previousMonthTotal: prev,
        changePercentage: calcPercentChange(totalSpent, prev),
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getMonthlyTrend(userId: string, months = 6) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    const totals = await getMonthTotals(userId, targetMonth, targetYear);
    trend.push({ month: targetMonth, year: targetYear, ...totals });
  }

  return trend;
}

// ── Recommendation Engine (broken into sub-generators) ─────────────

async function generateTransactionRecommendations(
  userId: string,
  current: MonthlyTotals,
  start: Date,
  end: Date,
  currentMonth: number,
  currentYear: number,
  monthProgress: number,
): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const fmt = formatCurrencyShort;

  if (current.totalIncome > 0) {
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const catWithId = categoryExpenses.filter((c): c is typeof c & { categoryId: string } => c.categoryId !== null);
    if (catWithId.length > 0) {
      const categories = await prisma.category.findMany({ where: { id: { in: catWithId.map((c) => c.categoryId) } } });
      const catMap = new Map(categories.map((c) => [c.id, c]));

      for (const catExpense of catWithId) {
        const spent = toNumber(catExpense._sum.amount);
        const pct = Math.round((spent / current.totalIncome) * 100);
        if (pct > 30) {
          recs.push({
            message: `Estás gastando un ${pct}% de tus ingresos en ${catMap.get(catExpense.categoryId)?.name ?? 'una categoría'}. Considera reducirlo por debajo del 30%.`,
            severity: Severity.WARNING,
            category: 'gasto_excesivo',
          });
        }
      }
    }

    if (current.savingsRate < 10) {
      recs.push({
        message: `Tu tasa de ahorro real es del ${current.savingsRate}%. Se recomienda mínimo un 20%. Revisa tus gastos más altos para encontrar donde recortar.`,
        severity: Severity.CRITICAL,
        category: 'ahorro',
      });
    } else if (current.savingsRate < 20) {
      recs.push({
        message: `Tu tasa de ahorro es del ${current.savingsRate}%. Intenta alcanzar al menos un 20% para tener un colchón financiero sólido.`,
        severity: Severity.WARNING,
        category: 'ahorro',
      });
    }
  }

  if (current.totalExpenses > current.totalIncome && current.totalIncome > 0) {
    recs.push({
      message: `Estás gastando más de lo que ganas este mes. Tu déficit actual es de ${fmt(current.totalExpenses - current.totalIncome)}. Necesitas reducir gastos o aumentar ingresos.`,
      severity: Severity.CRITICAL,
      category: 'balance_negativo',
    });
  }

  let consecutiveDeficits = 0;
  let checkMonth = currentMonth;
  let checkYear = currentYear;
  for (let i = 0; i < 12; i++) {
    const totals = await getMonthTotals(userId, checkMonth, checkYear);
    if (totals.totalIncome === 0 && totals.totalExpenses === 0) break;
    if (totals.totalExpenses > totals.totalIncome) consecutiveDeficits++;
    else break;
    const prev = getPreviousMonth(checkMonth, checkYear);
    checkMonth = prev.month;
    checkYear = prev.year;
  }
  if (consecutiveDeficits >= 3) {
    recs.push({
      message: `Llevas ${consecutiveDeficits} meses consecutivos gastando más de lo que ganas. Esto es insostenible a largo plazo.`,
      severity: Severity.CRITICAL,
      category: 'deficit_prolongado',
    });
  }

  const recurringTx = await prisma.transaction.findMany({
    where: { userId, recurringId: { not: null }, type: TransactionType.EXPENSE },
    select: { categoryId: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });
  if (recurringTx.length > 0) {
    const pm1 = getPreviousMonth(currentMonth, currentYear);
    const pm2 = getPreviousMonth(pm1.month, pm1.year);
    const threeMonthsAgo = getPreviousMonth(pm2.month, pm2.year);
    const catIds = [...new Set(recurringTx.map((t) => t.categoryId).filter(Boolean))] as string[];
    for (const catId of catIds) {
      const oldRange = getMonthRange(threeMonthsAgo.month, threeMonthsAgo.year);
      const curRange = getMonthRange(currentMonth, currentYear);
      const oldTotal = recurringTx.filter((t) => t.categoryId === catId && t.date >= oldRange.start && t.date <= oldRange.end).reduce((s, t) => s + toNumber(t.amount), 0);
      const newTotal = recurringTx.filter((t) => t.categoryId === catId && t.date >= curRange.start && t.date <= curRange.end).reduce((s, t) => s + toNumber(t.amount), 0);
      if (oldTotal > 0 && newTotal > 0) {
        const increase = ((newTotal - oldTotal) / oldTotal) * 100;
        if (increase > 15) {
          const category = await prisma.category.findUnique({ where: { id: catId } });
          recs.push({
            message: `Tus gastos recurrentes en ${category?.name ?? 'una categoría'} aumentaron un ${Math.round(increase)}% en los últimos 3 meses. Revisa si puedes optimizarlos o cancelar alguno.`,
            severity: Severity.INFO,
            category: 'suscripciones',
          });
        }
      }
    }
  }

  if (current.totalIncome > 0 && monthProgress > 0.1 && monthProgress < 0.9) {
    const projectedEnd = current.totalExpenses / monthProgress;
    if (projectedEnd > current.totalIncome * 1.1) {
      recs.push({
        message: `Al ritmo actual de gasto, terminarás el mes gastando aproximadamente ${fmt(Math.round(projectedEnd))}. Eso supera tus ingresos de ${fmt(current.totalIncome)}. Frena los gastos no esenciales.`,
        severity: Severity.WARNING,
        category: 'ritmo_gasto',
      });
    }
  }

  return recs;
}

async function generateProjectionRecommendations(
  userId: string,
  current: MonthlyTotals,
  start: Date,
  end: Date,
  monthProgress: number,
): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const fmt = formatCurrencyShort;

  const budgets = await prisma.budget.findMany({
    where: { userId, month: start.getMonth() + 1, year: start.getFullYear() },
    include: { category: true },
  });

  const incomeBudgets = budgets.filter((b) => b.type === 'INCOME');
  const expenseBudgets = budgets.filter((b) => b.type === 'EXPENSE');
  const totalProjectedIncome = incomeBudgets.reduce((s, b) => s + toNumber(b.amount), 0);
  const totalProjectedExpenses = expenseBudgets.reduce((s, b) => s + toNumber(b.amount), 0);
  const projectedBalance = totalProjectedIncome - totalProjectedExpenses;

  if (totalProjectedIncome === 0 && totalProjectedExpenses === 0) return recs;

  if (projectedBalance < 0) {
    recs.push({
      message: `Tu proyección del mes muestra un déficit de ${fmt(Math.abs(projectedBalance))}. Tus gastos planeados superan tus ingresos esperados. Revisa qué gastos puedes eliminar o reducir.`,
      severity: Severity.CRITICAL,
      category: 'proyeccion_deficit',
    });
  }

  if (totalProjectedIncome > 0) {
    const projSavingsRate = Math.round(((totalProjectedIncome - totalProjectedExpenses) / totalProjectedIncome) * 100);
    if (projSavingsRate >= 0 && projSavingsRate < 10) {
      recs.push({
        message: `Según tu proyección, solo ahorrarás un ${projSavingsRate}% este mes. Idealmente deberías planear ahorrar al menos un 20%. Revisa si puedes reducir algún gasto proyectado.`,
        severity: Severity.WARNING,
        category: 'proyeccion_ahorro',
      });
    } else if (projSavingsRate >= 10 && projSavingsRate < 20) {
      recs.push({
        message: `Tu proyección indica un ahorro del ${projSavingsRate}% del ingreso. Está bien, pero intenta llegar al 20% para tener más margen financiero.`,
        severity: Severity.INFO,
        category: 'proyeccion_ahorro',
      });
    }
  }

  if (totalProjectedIncome === 0 && totalProjectedExpenses > 0) {
    recs.push({
      message: `Tienes gastos proyectados por ${fmt(totalProjectedExpenses)} pero no has registrado ningún ingreso en la proyección. Agrega tus ingresos esperados para tener un panorama completo.`,
      severity: Severity.WARNING,
      category: 'proyeccion_incompleta',
    });
  }

  if (current.totalExpenses > totalProjectedExpenses && totalProjectedExpenses > 0) {
    const excessPct = Math.round(((current.totalExpenses - totalProjectedExpenses) / totalProjectedExpenses) * 100);
    recs.push({
      message: `Ya superaste tus gastos proyectados del mes en un ${excessPct}%. Gastaste ${fmt(current.totalExpenses)} de ${fmt(totalProjectedExpenses)} planeados. Controla los gastos restantes.`,
      severity: Severity.CRITICAL,
      category: 'proyeccion_excedida',
    });
  }

  const plannedCatIds = expenseBudgets.filter((b) => b.categoryId).map((b) => b.categoryId!);
  if (plannedCatIds.length > 0) {
    const unplannedResult = await prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end }, categoryId: { notIn: plannedCatIds } },
      _sum: { amount: true },
    });
    const unplanned = toNumber(unplannedResult._sum?.amount);
    if (unplanned > 0 && totalProjectedExpenses > 0) {
      const unplannedPct = Math.round((unplanned / totalProjectedExpenses) * 100);
      if (unplannedPct > 10) {
        recs.push({
          message: `Tienes ${fmt(unplanned)} en gastos no planeados (${unplannedPct}% de tu proyección). Estos gastos fuera de presupuesto afectan tu plan. Considera agregarlos a la proyección o reducirlos.`,
          severity: Severity.WARNING,
          category: 'gastos_no_planeados',
        });
      }
    }
  }

  for (const budget of expenseBudgets) {
    if (!budget.categoryId) continue;
    const spent = await prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, categoryId: budget.categoryId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const spentAmount = toNumber(spent._sum?.amount);
    const budgetAmount = toNumber(budget.amount);
    if (budgetAmount > 0 && spentAmount > budgetAmount) {
      recs.push({
        message: `Has superado tu presupuesto de ${budget.category?.name ?? budget.name ?? 'General'} en un ${Math.round((spentAmount / budgetAmount) * 100) - 100}% (gastaste ${fmt(spentAmount)} de ${fmt(budgetAmount)} proyectados).`,
        severity: Severity.WARNING,
        category: 'presupuesto',
      });
    }
  }

  for (const budget of expenseBudgets) {
    const budgetAmount = toNumber(budget.amount);
    if (totalProjectedExpenses > 0 && budgetAmount > 0) {
      const share = Math.round((budgetAmount / totalProjectedExpenses) * 100);
      if (share > 50) {
        recs.push({
          message: `${budget.category?.name ?? budget.name ?? 'un gasto'} representa el ${share}% de todos tus gastos proyectados (${fmt(budgetAmount)}). Cuando un solo gasto domina tu presupuesto, cualquier imprevisto en esa área afecta mucho. Busca alternativas o negocia mejores condiciones.`,
          severity: Severity.INFO,
          category: 'concentracion_gasto',
        });
      }
    }
  }

  if (totalProjectedExpenses > 0 && current.totalExpenses > 0 && current.totalExpenses <= totalProjectedExpenses * 0.8 && monthProgress > 0.5) {
    recs.push({
      message: `Vas muy bien con tu presupuesto. Has gastado ${fmt(current.totalExpenses)} de ${fmt(totalProjectedExpenses)} proyectados y ya pasó más de la mitad del mes. ¡Buen control!`,
      severity: Severity.INFO,
      category: 'felicitacion_presupuesto',
    });
  }

  if (projectedBalance > 0 && totalProjectedIncome > 0) {
    const projSavingsPct = Math.round((projectedBalance / totalProjectedIncome) * 100);
    if (projSavingsPct >= 15) {
      const investments = await prisma.investment.findMany({ where: { userId, isActive: true } });
      if (investments.length === 0) {
        recs.push({
          message: `Según tu proyección, te sobrará ${fmt(projectedBalance)} este mes. Es un buen momento para abrir un CDT o fondo de inversión. Incluso invertir ${fmt(Math.round(projectedBalance * 0.3))} mensualmente puede generar buenos rendimientos a largo plazo.`,
          severity: Severity.INFO,
          category: 'inversion_proyectada',
        });
      }
    }
  }

  return recs;
}

async function generateInvestmentRecommendations(userId: string, current: MonthlyTotals): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const fmt = formatCurrencyShort;

  const investments = await prisma.investment.findMany({ where: { userId, isActive: true } });
  const totalInvested = investments.reduce((s, i) => s + toNumber(i.amountInvested), 0);
  const totalCurrentValue = investments.reduce((s, i) => s + toNumber(i.currentValue), 0);
  const actualBalance = current.totalIncome - current.totalExpenses;

  if (actualBalance > 0 && current.totalIncome > 0) {
    const freeBalancePct = Math.round((actualBalance / current.totalIncome) * 100);

    if (investments.length === 0 && freeBalancePct >= 15) {
      recs.push({
        message: `Tienes un sobrante de ${fmt(actualBalance)} este mes (${freeBalancePct}% de tu ingreso) y aún no tienes inversiones. Podrías invertir al menos una parte en un CDT o fondo de inversión para que tu dinero trabaje por ti.`,
        severity: Severity.INFO,
        category: 'inversion_sugerencia',
      });
    }

    if (investments.length > 0 && freeBalancePct >= 20) {
      recs.push({
        message: `Tienes ${fmt(actualBalance)} de sobrante este mes. Podrías destinar aproximadamente ${fmt(Math.round(actualBalance * 0.5))} (50% del sobrante) a tus inversiones para maximizar tu rendimiento a largo plazo.`,
        severity: Severity.INFO,
        category: 'inversion_sugerencia',
      });
    }
  }

  if (investments.length > 0) {
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPct = totalInvested > 0 ? Math.round((totalReturn / totalInvested) * 10000) / 100 : 0;

    if (totalReturn < 0) {
      recs.push({
        message: `Tu portafolio de inversiones tiene una pérdida de ${fmt(Math.abs(totalReturn))} (${Math.abs(returnPct)}% negativo). Revisa tus inversiones y evalúa si necesitas ajustar tu estrategia.`,
        severity: Severity.WARNING,
        category: 'inversion_rendimiento',
      });
    } else if (returnPct > 0) {
      recs.push({
        message: `Tu portafolio de inversiones ha generado ${fmt(totalReturn)} de ganancia (${returnPct}% de rendimiento). ¡Sigue así!`,
        severity: Severity.INFO,
        category: 'inversion_rendimiento',
      });
    }
  }

  if (investments.length >= 2) {
    const types = new Set(investments.map((i) => i.type));
    if (types.size === 1) {
      const typeLabels: Record<string, string> = { STOCKS: 'acciones', CDT: 'CDTs', CRYPTO: 'criptomonedas', FUND: 'fondos', FOREX: 'forex', OTHER: 'otros' };
      recs.push({
        message: `Todas tus inversiones (${fmt(totalInvested)}) están en ${typeLabels[investments[0]!.type] ?? investments[0]!.type}. Diversificar en diferentes tipos de inversión reduce el riesgo. Considera distribuir en al menos 2 tipos diferentes.`,
        severity: Severity.WARNING,
        category: 'inversion_diversificacion',
      });
    }
  }

  if (current.totalIncome > 0 && totalInvested > 0) {
    if (totalInvested / (current.totalIncome * 12) < 0.5) {
      recs.push({
        message: `Tu capital invertido (${fmt(totalInvested)}) representa menos de 6 meses de tu ingreso. Un fondo de emergencia sólido debería ser de al menos 6 meses de gastos. Prioriza aumentar tus reservas.`,
        severity: Severity.INFO,
        category: 'inversion_reserva',
      });
    }
  }

  if (current.totalIncome > 0 && investments.length === 0 && actualBalance > 0) {
    recs.push({
      message: `Consejo: crea un fondo de emergencia de al menos ${fmt(current.totalExpenses * 6)} (6 meses de tus gastos actuales). Puedes empezar con un CDT a corto plazo o una cuenta de ahorros de alto rendimiento.`,
      severity: Severity.INFO,
      category: 'fondo_emergencia',
    });
  }

  return recs;
}

function generatePositiveRecommendations(current: MonthlyTotals, hasInvestments: boolean, totalInvested: number): Recommendation[] {
  const recs: Recommendation[] = [];
  const fmt = formatCurrencyShort;

  if (current.totalIncome > 0 && current.savingsRate >= 20) {
    recs.push({
      message: `¡Excelente! Tu tasa de ahorro es del ${current.savingsRate}%. Estás por encima del 20% recomendado. Sigue así para alcanzar tus metas financieras.`,
      severity: Severity.INFO,
      category: 'felicitacion',
    });
  }

  if (hasInvestments && current.totalIncome > 0 && current.savingsRate >= 20) {
    recs.push({
      message: `Tienes una buena tasa de ahorro (${current.savingsRate}%) y inversión(es) activa(s) por ${fmt(totalInvested)}. Estás construyendo un buen perfil financiero.`,
      severity: Severity.INFO,
      category: 'felicitacion_general',
    });
  }

  return recs;
}

export async function generateRecommendations(userId: string): Promise<number> {
  await prisma.recommendation.deleteMany({ where: { userId, isRead: false } });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { start, end } = getMonthRange(currentMonth, currentYear);
  const monthProgress = now.getDate() / new Date(currentYear, currentMonth, 0).getDate();

  const current = await getMonthTotals(userId, currentMonth, currentYear);

  const [transactionRecs, projectionRecs, investmentRecs] = await Promise.all([
    generateTransactionRecommendations(userId, current, start, end, currentMonth, currentYear, monthProgress),
    generateProjectionRecommendations(userId, current, start, end, monthProgress),
    generateInvestmentRecommendations(userId, current),
  ]);

  const investments = await prisma.investment.findMany({ where: { userId, isActive: true } });
  const totalInvested = investments.reduce((s, i) => s + toNumber(i.amountInvested), 0);
  const positiveRecs = generatePositiveRecommendations(current, investments.length > 0, totalInvested);

  const allRecs = [...transactionRecs, ...projectionRecs, ...investmentRecs, ...positiveRecs];

  if (allRecs.length > 0) {
    await prisma.recommendation.createMany({
      data: allRecs.map((r) => ({ userId, message: r.message, severity: r.severity, category: r.category })),
    });
  }

  return allRecs.length;
}

export async function getRecommendations(userId: string, unreadOnly = false) {
  const where: { userId: string; isRead?: boolean } = { userId };
  if (unreadOnly) where.isRead = false;
  return prisma.recommendation.findMany({ where, orderBy: [{ createdAt: 'desc' }] });
}

export async function markRecommendationRead(id: string, userId: string) {
  const recommendation = await prisma.recommendation.findUnique({ where: { id } });
  if (!recommendation) throw new NotFoundError('Recommendation');
  if (recommendation.userId !== userId) throw new ForbiddenError('No tienes acceso a esta recomendación');
  return prisma.recommendation.update({ where: { id }, data: { isRead: true } });
}
