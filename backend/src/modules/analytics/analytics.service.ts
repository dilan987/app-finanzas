import { TransactionType, Severity } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

interface MonthlyTotals {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

interface FinancialSummary extends MonthlyTotals {
  month: number;
  year: number;
  previousMonth: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
  };
  comparison: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
    savingsRateChange: number;
  };
}

interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalSpent: number;
  percentage: number;
  previousMonthTotal: number;
  changePercentage: number;
}

interface MonthlyTrendItem {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

function calcSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 10000) / 100;
}

async function getMonthTotals(userId: string, month: number, year: number): Promise<MonthlyTotals> {
  const { start, end } = getMonthRange(month, year);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = incomeResult._sum.amount?.toNumber() ?? 0;
  const totalExpenses = expenseResult._sum.amount?.toNumber() ?? 0;
  const balance = totalIncome - totalExpenses;
  const savingsRate = calcSavingsRate(totalIncome, totalExpenses);

  return { totalIncome, totalExpenses, balance, savingsRate };
}

export async function getFinancialSummary(
  userId: string,
  month: number,
  year: number,
): Promise<FinancialSummary> {
  const prev = getPreviousMonth(month, year);

  const [current, previous] = await Promise.all([
    getMonthTotals(userId, month, year),
    getMonthTotals(userId, prev.month, prev.year),
  ]);

  return {
    month,
    year,
    ...current,
    previousMonth: {
      totalIncome: previous.totalIncome,
      totalExpenses: previous.totalExpenses,
      balance: previous.balance,
      savingsRate: previous.savingsRate,
    },
    comparison: {
      incomeChange: calcPercentChange(current.totalIncome, previous.totalIncome),
      expenseChange: calcPercentChange(current.totalExpenses, previous.totalExpenses),
      balanceChange: calcPercentChange(current.balance, previous.balance),
      savingsRateChange: Math.round((current.savingsRate - previous.savingsRate) * 100) / 100,
    },
  };
}

export async function getCategoryBreakdown(
  userId: string,
  month: number,
  year: number,
): Promise<CategoryBreakdownItem[]> {
  const { start, end } = getMonthRange(month, year);
  const prev = getPreviousMonth(month, year);
  const prevRange = getMonthRange(prev.month, prev.year);

  const [currentExpenses, previousExpenses] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: prevRange.start, lte: prevRange.end },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalExpenses = currentExpenses.reduce(
    (sum, item) => sum + (item._sum.amount?.toNumber() ?? 0),
    0,
  );

  const previousMap = new Map<string, number>();
  for (const item of previousExpenses) {
    previousMap.set(item.categoryId, item._sum.amount?.toNumber() ?? 0);
  }

  const categoryIds = currentExpenses.map((item) => item.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown: CategoryBreakdownItem[] = currentExpenses
    .map((item) => {
      const totalSpent = item._sum.amount?.toNumber() ?? 0;
      const category = categoryMap.get(item.categoryId);
      const previousMonthTotal = previousMap.get(item.categoryId) ?? 0;

      return {
        categoryId: item.categoryId,
        categoryName: category?.name ?? 'Sin categoría',
        categoryIcon: category?.icon ?? 'tag',
        categoryColor: category?.color ?? '#6B7280',
        totalSpent,
        percentage: totalExpenses > 0
          ? Math.round((totalSpent / totalExpenses) * 10000) / 100
          : 0,
        previousMonthTotal,
        changePercentage: calcPercentChange(totalSpent, previousMonthTotal),
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return breakdown;
}

export async function getMonthlyTrend(
  userId: string,
  months: number = 6,
): Promise<MonthlyTrendItem[]> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const trend: MonthlyTrendItem[] = [];

  for (let i = months - 1; i >= 0; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;

    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const totals = await getMonthTotals(userId, targetMonth, targetYear);

    trend.push({
      month: targetMonth,
      year: targetYear,
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      balance: totals.balance,
      savingsRate: totals.savingsRate,
    });
  }

  return trend;
}

export async function generateRecommendations(userId: string): Promise<number> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  // Delete old unread recommendations to regenerate
  await prisma.recommendation.deleteMany({
    where: { userId, isRead: false },
  });

  const recommendations: Array<{
    message: string;
    severity: Severity;
    category: string;
  }> = [];

  // === DATA GATHERING ===
  const current = await getMonthTotals(userId, currentMonth, currentYear);
  const { start, end } = getMonthRange(currentMonth, currentYear);

  // Budget/projection data
  const budgets = await prisma.budget.findMany({
    where: { userId, month: currentMonth, year: currentYear },
    include: { category: true },
  });
  const incomeBudgets = budgets.filter(b => b.type === 'INCOME');
  const expenseBudgets = budgets.filter(b => b.type === 'EXPENSE');
  const totalProjectedIncome = incomeBudgets.reduce((s, b) => s + b.amount.toNumber(), 0);
  const totalProjectedExpenses = expenseBudgets.reduce((s, b) => s + b.amount.toNumber(), 0);
  const projectedBalance = totalProjectedIncome - totalProjectedExpenses;

  // Investment data
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true },
  });
  const totalInvested = investments.reduce((s, i) => s + i.amountInvested.toNumber(), 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue.toNumber(), 0);

  // Day of month progress (to estimate pace)
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  // =============================================
  // SECTION 1: TRANSACTION-BASED RECOMMENDATIONS
  // =============================================

  // Rule 1: Category spending > 30% of income
  if (current.totalIncome > 0) {
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const categoryIds = categoryExpenses.map((c) => c.categoryId);
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    for (const catExpense of categoryExpenses) {
      const spent = catExpense._sum.amount?.toNumber() ?? 0;
      const pct = Math.round((spent / current.totalIncome) * 100);
      if (pct > 30) {
        const catName = categoryMap.get(catExpense.categoryId)?.name ?? 'una categoría';
        recommendations.push({
          message: `Estás gastando un ${pct}% de tus ingresos en ${catName}. Considera reducirlo por debajo del 30%.`,
          severity: Severity.WARNING,
          category: 'gasto_excesivo',
        });
      }
    }
  }

  // Rule 2 & 3: Savings rate
  if (current.totalIncome > 0) {
    if (current.savingsRate < 10) {
      recommendations.push({
        message: `Tu tasa de ahorro real es del ${current.savingsRate}%. Se recomienda mínimo un 20%. Revisa tus gastos más altos para encontrar donde recortar.`,
        severity: Severity.CRITICAL,
        category: 'ahorro',
      });
    } else if (current.savingsRate < 20) {
      recommendations.push({
        message: `Tu tasa de ahorro es del ${current.savingsRate}%. Intenta alcanzar al menos un 20% para tener un colchón financiero sólido.`,
        severity: Severity.WARNING,
        category: 'ahorro',
      });
    }
  }

  // Rule 4: Expenses > Income current month
  if (current.totalExpenses > current.totalIncome && current.totalIncome > 0) {
    const deficit = current.totalExpenses - current.totalIncome;
    recommendations.push({
      message: `Estás gastando más de lo que ganas este mes. Tu déficit actual es de ${fmt(deficit)}. Necesitas reducir gastos o aumentar ingresos.`,
      severity: Severity.CRITICAL,
      category: 'balance_negativo',
    });
  }

  // Rule 5: Expenses > Income for 3+ consecutive months
  let consecutiveDeficitMonths = 0;
  let checkMonth = currentMonth;
  let checkYear = currentYear;
  for (let i = 0; i < 12; i++) {
    const monthTotals = await getMonthTotals(userId, checkMonth, checkYear);
    if (monthTotals.totalIncome === 0 && monthTotals.totalExpenses === 0) break;
    if (monthTotals.totalExpenses > monthTotals.totalIncome) {
      consecutiveDeficitMonths++;
    } else {
      break;
    }
    const prev = getPreviousMonth(checkMonth, checkYear);
    checkMonth = prev.month;
    checkYear = prev.year;
  }
  if (consecutiveDeficitMonths >= 3) {
    recommendations.push({
      message: `Llevas ${consecutiveDeficitMonths} meses consecutivos gastando más de lo que ganas. Esto es insostenible a largo plazo.`,
      severity: Severity.CRITICAL,
      category: 'deficit_prolongado',
    });
  }

  // Rule 6: Recurring expenses increased >15% in last 3 months
  const threeMonthsAgo = getPreviousMonth(
    getPreviousMonth(getPreviousMonth(currentMonth, currentYear).month,
      getPreviousMonth(currentMonth, currentYear).year).month,
    getPreviousMonth(getPreviousMonth(currentMonth, currentYear).month,
      getPreviousMonth(currentMonth, currentYear).year).year,
  );
  const recurringTransactions = await prisma.transaction.findMany({
    where: { userId, recurringId: { not: null }, type: TransactionType.EXPENSE },
    select: { categoryId: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });
  if (recurringTransactions.length > 0) {
    const recurringCategoryIds = [...new Set(recurringTransactions.map((t) => t.categoryId))];
    for (const catId of recurringCategoryIds) {
      const threeMonthRange = getMonthRange(threeMonthsAgo.month, threeMonthsAgo.year);
      const currentRange = getMonthRange(currentMonth, currentYear);
      const oldTotal = recurringTransactions
        .filter((t) => t.categoryId === catId && t.date >= threeMonthRange.start && t.date <= threeMonthRange.end)
        .reduce((s, t) => s + t.amount.toNumber(), 0);
      const newTotal = recurringTransactions
        .filter((t) => t.categoryId === catId && t.date >= currentRange.start && t.date <= currentRange.end)
        .reduce((s, t) => s + t.amount.toNumber(), 0);
      if (oldTotal > 0 && newTotal > 0) {
        const increase = ((newTotal - oldTotal) / oldTotal) * 100;
        if (increase > 15) {
          const category = await prisma.category.findUnique({ where: { id: catId } });
          recommendations.push({
            message: `Tus gastos recurrentes en ${category?.name ?? 'una categoría'} aumentaron un ${Math.round(increase)}% en los últimos 3 meses. Revisa si puedes optimizarlos o cancelar alguno.`,
            severity: Severity.INFO,
            category: 'suscripciones',
          });
        }
      }
    }
  }

  // Rule 7: Budget exceeded in any category
  if (expenseBudgets.length > 0) {
    for (const budget of expenseBudgets) {
      if (!budget.categoryId) continue;
      const spent = await prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE, categoryId: budget.categoryId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });
      const spentAmount = spent._sum?.amount?.toNumber() ?? 0;
      const budgetAmount = budget.amount.toNumber();
      if (budgetAmount > 0 && spentAmount > budgetAmount) {
        const pct = Math.round((spentAmount / budgetAmount) * 100);
        const budgetName = budget.category?.name ?? budget.name ?? 'General';
        recommendations.push({
          message: `Has superado tu presupuesto de ${budgetName} en un ${pct - 100}% (gastaste ${fmt(spentAmount)} de ${fmt(budgetAmount)} proyectados).`,
          severity: Severity.WARNING,
          category: 'presupuesto',
        });
      }
    }
  }

  // Rule 8: Spending pace — on track to exceed budget before month ends
  if (current.totalIncome > 0 && monthProgress > 0.1 && monthProgress < 0.9) {
    const projectedEndExpenses = current.totalExpenses / monthProgress;
    if (projectedEndExpenses > current.totalIncome * 1.1) {
      recommendations.push({
        message: `Al ritmo actual de gasto, terminarás el mes gastando aproximadamente ${fmt(Math.round(projectedEndExpenses))}. Eso supera tus ingresos de ${fmt(current.totalIncome)}. Frena los gastos no esenciales.`,
        severity: Severity.WARNING,
        category: 'ritmo_gasto',
      });
    }
  }

  // =============================================
  // SECTION 2: PROJECTION-BASED RECOMMENDATIONS
  // =============================================

  if (totalProjectedIncome > 0 || totalProjectedExpenses > 0) {
    // Rule 9: Projected balance is negative
    if (projectedBalance < 0) {
      recommendations.push({
        message: `Tu proyección del mes muestra un déficit de ${fmt(Math.abs(projectedBalance))}. Tus gastos planeados superan tus ingresos esperados. Revisa qué gastos puedes eliminar o reducir.`,
        severity: Severity.CRITICAL,
        category: 'proyeccion_deficit',
      });
    }

    // Rule 10: Projected savings rate too low
    if (totalProjectedIncome > 0) {
      const projectedSavingsRate = Math.round(((totalProjectedIncome - totalProjectedExpenses) / totalProjectedIncome) * 100);
      if (projectedSavingsRate >= 0 && projectedSavingsRate < 10) {
        recommendations.push({
          message: `Según tu proyección, solo ahorrarás un ${projectedSavingsRate}% este mes. Idealmente deberías planear ahorrar al menos un 20%. Revisa si puedes reducir algún gasto proyectado.`,
          severity: Severity.WARNING,
          category: 'proyeccion_ahorro',
        });
      } else if (projectedSavingsRate >= 10 && projectedSavingsRate < 20) {
        recommendations.push({
          message: `Tu proyección indica un ahorro del ${projectedSavingsRate}% del ingreso. Está bien, pero intenta llegar al 20% para tener más margen financiero.`,
          severity: Severity.INFO,
          category: 'proyeccion_ahorro',
        });
      }
    }

    // Rule 11: No income projected
    if (totalProjectedIncome === 0 && totalProjectedExpenses > 0) {
      recommendations.push({
        message: `Tienes gastos proyectados por ${fmt(totalProjectedExpenses)} pero no has registrado ningún ingreso en la proyección. Agrega tus ingresos esperados para tener un panorama completo.`,
        severity: Severity.WARNING,
        category: 'proyeccion_incompleta',
      });
    }

    // Rule 12: Actual spending already exceeded projection (mid-month)
    if (current.totalExpenses > totalProjectedExpenses && totalProjectedExpenses > 0) {
      const excessPct = Math.round(((current.totalExpenses - totalProjectedExpenses) / totalProjectedExpenses) * 100);
      recommendations.push({
        message: `Ya superaste tus gastos proyectados del mes en un ${excessPct}%. Gastaste ${fmt(current.totalExpenses)} de ${fmt(totalProjectedExpenses)} planeados. Controla los gastos restantes.`,
        severity: Severity.CRITICAL,
        category: 'proyeccion_excedida',
      });
    }

    // Rule 13: Unplanned expenses detected
    const plannedCategoryIds = expenseBudgets.filter(b => b.categoryId).map(b => b.categoryId!);
    if (plannedCategoryIds.length > 0) {
      const unplannedResult = await prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end }, categoryId: { notIn: plannedCategoryIds } },
        _sum: { amount: true },
      });
      const unplanned = unplannedResult._sum?.amount?.toNumber() ?? 0;
      if (unplanned > 0 && totalProjectedExpenses > 0) {
        const unplannedPct = Math.round((unplanned / totalProjectedExpenses) * 100);
        if (unplannedPct > 10) {
          recommendations.push({
            message: `Tienes ${fmt(unplanned)} en gastos no planeados (${unplannedPct}% de tu proyección). Estos gastos fuera de presupuesto afectan tu plan. Considera agregarlos a la proyección o reducirlos.`,
            severity: Severity.WARNING,
            category: 'gastos_no_planeados',
          });
        }
      }
    }

    // Rule 14: Single category dominates projection (>50% of projected expenses)
    for (const budget of expenseBudgets) {
      const budgetAmount = budget.amount.toNumber();
      if (totalProjectedExpenses > 0 && budgetAmount > 0) {
        const share = Math.round((budgetAmount / totalProjectedExpenses) * 100);
        if (share > 50) {
          const name = budget.category?.name ?? budget.name ?? 'un gasto';
          recommendations.push({
            message: `${name} representa el ${share}% de todos tus gastos proyectados (${fmt(budgetAmount)}). Cuando un solo gasto domina tu presupuesto, cualquier imprevisto en esa área afecta mucho. Busca alternativas o negocia mejores condiciones.`,
            severity: Severity.INFO,
            category: 'concentracion_gasto',
          });
        }
      }
    }
  }

  // =============================================
  // SECTION 3: INVESTMENT RECOMMENDATIONS
  // =============================================

  // Rule 15: Free balance available for investment
  const actualBalance = current.totalIncome - current.totalExpenses;
  if (actualBalance > 0 && current.totalIncome > 0) {
    const freeBalancePct = Math.round((actualBalance / current.totalIncome) * 100);

    // If user has good savings but no investments
    if (investments.length === 0 && freeBalancePct >= 15) {
      recommendations.push({
        message: `Tienes un sobrante de ${fmt(actualBalance)} este mes (${freeBalancePct}% de tu ingreso) y aún no tienes inversiones. Podrías invertir al menos una parte en un CDT o fondo de inversión para que tu dinero trabaje por ti.`,
        severity: Severity.INFO,
        category: 'inversion_sugerencia',
      });
    }

    // If user has investments but still has free balance
    if (investments.length > 0 && freeBalancePct >= 20) {
      const suggestedInvestment = Math.round(actualBalance * 0.5);
      recommendations.push({
        message: `Tienes ${fmt(actualBalance)} de sobrante este mes. Podrías destinar aproximadamente ${fmt(suggestedInvestment)} (50% del sobrante) a tus inversiones para maximizar tu rendimiento a largo plazo.`,
        severity: Severity.INFO,
        category: 'inversion_sugerencia',
      });
    }
  }

  // Rule 16: Projected free balance — suggest investment before month starts
  if (projectedBalance > 0 && totalProjectedIncome > 0) {
    const projSavingsPct = Math.round((projectedBalance / totalProjectedIncome) * 100);
    if (projSavingsPct >= 15 && investments.length === 0) {
      recommendations.push({
        message: `Según tu proyección, te sobrará ${fmt(projectedBalance)} este mes. Es un buen momento para abrir un CDT o fondo de inversión. Incluso invertir ${fmt(Math.round(projectedBalance * 0.3))} mensualmente puede generar buenos rendimientos a largo plazo.`,
        severity: Severity.INFO,
        category: 'inversion_proyectada',
      });
    }
  }

  // Rule 17: Investment portfolio performance
  if (investments.length > 0) {
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPct = totalInvested > 0 ? Math.round((totalReturn / totalInvested) * 10000) / 100 : 0;

    if (totalReturn < 0) {
      recommendations.push({
        message: `Tu portafolio de inversiones tiene una pérdida de ${fmt(Math.abs(totalReturn))} (${Math.abs(returnPct)}% negativo). Revisa tus inversiones y evalúa si necesitas ajustar tu estrategia.`,
        severity: Severity.WARNING,
        category: 'inversion_rendimiento',
      });
    } else if (returnPct > 0) {
      recommendations.push({
        message: `Tu portafolio de inversiones ha generado ${fmt(totalReturn)} de ganancia (${returnPct}% de rendimiento). ¡Sigue así!`,
        severity: Severity.INFO,
        category: 'inversion_rendimiento',
      });
    }
  }

  // Rule 18: Low diversification — all invested in one type
  if (investments.length >= 2) {
    const types = new Set(investments.map(i => i.type));
    if (types.size === 1) {
      const type = investments[0].type;
      const typeLabels: Record<string, string> = { STOCKS: 'acciones', CDT: 'CDTs', CRYPTO: 'criptomonedas', FUND: 'fondos', FOREX: 'forex', OTHER: 'otros' };
      recommendations.push({
        message: `Todas tus inversiones (${fmt(totalInvested)}) están en ${typeLabels[type] ?? type}. Diversificar en diferentes tipos de inversión reduce el riesgo. Considera distribuir en al menos 2 tipos diferentes.`,
        severity: Severity.WARNING,
        category: 'inversion_diversificacion',
      });
    }
  }

  // Rule 19: Investment vs income ratio
  if (current.totalIncome > 0 && totalInvested > 0) {
    const investmentToIncomeRatio = totalInvested / (current.totalIncome * 12);
    if (investmentToIncomeRatio < 0.5) {
      recommendations.push({
        message: `Tu capital invertido (${fmt(totalInvested)}) representa menos de 6 meses de tu ingreso. Un fondo de emergencia sólido debería ser de al menos 6 meses de gastos. Prioriza aumentar tus reservas.`,
        severity: Severity.INFO,
        category: 'inversion_reserva',
      });
    }
  }

  // Rule 20: No emergency fund suggestion
  if (current.totalIncome > 0 && investments.length === 0 && actualBalance > 0) {
    const emergencyFundTarget = current.totalExpenses * 6;
    recommendations.push({
      message: `Consejo: crea un fondo de emergencia de al menos ${fmt(emergencyFundTarget)} (6 meses de tus gastos actuales). Puedes empezar con un CDT a corto plazo o una cuenta de ahorros de alto rendimiento.`,
      severity: Severity.INFO,
      category: 'fondo_emergencia',
    });
  }

  // =============================================
  // SECTION 4: POSITIVE REINFORCEMENT
  // =============================================

  // Rule 21: Good savings rate
  if (current.totalIncome > 0 && current.savingsRate >= 20) {
    recommendations.push({
      message: `¡Excelente! Tu tasa de ahorro es del ${current.savingsRate}%. Estás por encima del 20% recomendado. Sigue así para alcanzar tus metas financieras.`,
      severity: Severity.INFO,
      category: 'felicitacion',
    });
  }

  // Rule 22: Spending under control vs projection
  if (totalProjectedExpenses > 0 && current.totalExpenses > 0 && current.totalExpenses <= totalProjectedExpenses * 0.8 && monthProgress > 0.5) {
    recommendations.push({
      message: `Vas muy bien con tu presupuesto. Has gastado ${fmt(current.totalExpenses)} de ${fmt(totalProjectedExpenses)} proyectados y ya pasó más de la mitad del mes. ¡Buen control!`,
      severity: Severity.INFO,
      category: 'felicitacion_presupuesto',
    });
  }

  // Rule 23: Has investments and good savings
  if (investments.length > 0 && current.totalIncome > 0 && current.savingsRate >= 20) {
    recommendations.push({
      message: `Tienes una buena tasa de ahorro (${current.savingsRate}%) y ${investments.length} inversión(es) activa(s) por ${fmt(totalInvested)}. Estás construyendo un buen perfil financiero.`,
      severity: Severity.INFO,
      category: 'felicitacion_general',
    });
  }

  // Persist recommendations
  if (recommendations.length > 0) {
    await prisma.recommendation.createMany({
      data: recommendations.map((r) => ({
        userId,
        message: r.message,
        severity: r.severity,
        category: r.category,
      })),
    });
  }

  return recommendations.length;
}

export async function getRecommendations(userId: string, unreadOnly: boolean = false) {
  const where: { userId: string; isRead?: boolean } = { userId };

  if (unreadOnly) {
    where.isRead = false;
  }

  return prisma.recommendation.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
  });
}

export async function markRecommendationRead(id: string, userId: string) {
  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    throw new NotFoundError('Recommendation');
  }

  if (recommendation.userId !== userId) {
    throw new ForbiddenError('No tienes acceso a esta recomendación');
  }

  return prisma.recommendation.update({
    where: { id },
    data: { isRead: true },
  });
}
