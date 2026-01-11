import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/get-server-session';
import { db } from '@/lib/config/db';
import { getMonthRange } from '@/lib/utils/dates';
import { getCurrentPeriodStart, isSameUTCDate } from '@/lib/utils/periods';
import { convertCurrencyWithInfo, buildRateKey, RateMap, ConversionResult, toDisplayAmount } from '@/lib/utils/money';
import { BudgetCards } from '@/components/dashboard/budget-cards';
import { ChartAreaInteractive, ChartDataPoint } from '@/components/dashboard/chart-area-interactive';
import { ChartExpenseBreakdown } from '@/components/dashboard/chart-expense-breakdown';
import { ChartIncomeSources } from '@/components/dashboard/chart-income-sources';
import { ChartProjections } from '@/components/dashboard/chart-projections';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ConversionWarnings } from '@/components/dashboard/conversion-warnings';
import { getProjections } from '@/lib/server/savings';
import { Currency, PaymentCadence } from '@prisma/client';

interface ConversionWarning {
  from: string;
  to: string;
  type: 'missing' | 'chain';
  chain?: string[];
}

// Helper to get month key string
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect('/login');
  }

  const { start, end } = getMonthRange();

  // Fetch user's base currency
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { baseCurrency: true },
  });
  const baseCurrency: Currency = user?.baseCurrency || 'CRC';

  // Fetch exchange rates (most recent for each currency pair)
  const exchangeRates = await db.exchangeRate.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null }, // Global rates
      ],
    },
    orderBy: { effectiveDate: 'desc' },
  });

  // Build rate map for quick lookup (with rate types)
  const rates: RateMap = {};
  for (const rate of exchangeRates) {
    // Key with rate type (preferred)
    const keyWithType = buildRateKey(rate.fromCurrency, rate.toCurrency, rate.rateType);
    // Only use the first (most recent) rate for each pair + type combo
    if (!rates[keyWithType]) {
      rates[keyWithType] = Number(rate.rate);
    }
    
    // Also store without rate type for backwards compatibility
    const legacyKey = buildRateKey(rate.fromCurrency, rate.toCurrency);
    if (!rates[legacyKey]) {
      rates[legacyKey] = Number(rate.rate);
    }
  }

  // Fetch income for current month
  const incomes = await db.income.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  // Fetch expenses for current month
  const expenses = await db.extraExpense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 10,
  });

  // Fetch recurring payments
  const recurringPayments = await db.recurringPayment.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  // Fetch subscriptions
  const subscriptions = await db.subscription.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  // Build cadence maps for each payment/subscription
  const recurringCadences: Record<string, PaymentCadence> = {};
  recurringPayments.forEach(p => { recurringCadences[p.id] = p.cadence; });
  
  const subscriptionCadences: Record<string, PaymentCadence> = {};
  subscriptions.forEach(s => { subscriptionCadences[s.id] = s.cadence; });

  // Fetch all payment instances for user's payments
  const paymentInstances = await db.paymentInstance.findMany({
    where: {
      OR: [
        { recurringPayment: { userId: session.user.id } },
        { subscription: { userId: session.user.id } },
      ],
    },
    select: {
      recurringPaymentId: true,
      subscriptionId: true,
      periodStart: true,
    },
  });

  // Determine which payments are paid for their current period based on cadence
  const paidRecurringIds: string[] = [];
  for (const payment of recurringPayments) {
    const currentPeriodStart = getCurrentPeriodStart(payment.cadence);
    const isPaid = paymentInstances.some(
      (instance) =>
        instance.recurringPaymentId === payment.id &&
        isSameUTCDate(new Date(instance.periodStart), currentPeriodStart)
    );
    if (isPaid) {
      paidRecurringIds.push(payment.id);
    }
  }

  const paidSubscriptionIds: string[] = [];
  for (const sub of subscriptions) {
    const currentPeriodStart = getCurrentPeriodStart(sub.cadence);
    const isPaid = paymentInstances.some(
      (instance) =>
        instance.subscriptionId === sub.id &&
        isSameUTCDate(new Date(instance.periodStart), currentPeriodStart)
    );
    if (isPaid) {
      paidSubscriptionIds.push(sub.id);
    }
  }

  // Collect conversion warnings
  const conversionWarnings: ConversionWarning[] = [];

  // Helper to track conversion results
  const trackConversion = (result: ConversionResult, from: Currency, to: Currency) => {
    if (!result.success) {
      conversionWarnings.push({ from, to, type: 'missing' });
    } else if (result.method === 'chain' && result.chain) {
      conversionWarnings.push({ from, to, type: 'chain', chain: result.chain });
    }
  };

  // Calculate totals with proper currency conversion to base currency
  const totalIncome = incomes.reduce((sum, income) => {
    const result = convertCurrencyWithInfo(income.amount, income.currency, baseCurrency, rates);
    trackConversion(result, income.currency, baseCurrency);
    return sum + result.amount;
  }, 0);

  const totalExpenses = expenses.reduce((sum, exp) => {
    const result = convertCurrencyWithInfo(exp.amount, exp.currency, baseCurrency, rates);
    trackConversion(result, exp.currency, baseCurrency);
    return sum + result.amount;
  }, 0);

  // Also add recurring payments and subscriptions to expenses for accurate budget
  const recurringTotal = recurringPayments.reduce((sum, payment) => {
    const result = convertCurrencyWithInfo(payment.amount, payment.currency, baseCurrency, rates);
    trackConversion(result, payment.currency, baseCurrency);
    return sum + result.amount;
  }, 0);

  const subscriptionsTotal = subscriptions.reduce((sum, sub) => {
    const result = convertCurrencyWithInfo(sub.amount, sub.currency, baseCurrency, rates);
    trackConversion(result, sub.currency, baseCurrency);
    return sum + result.amount;
  }, 0);

  const totalMonthlyExpenses = totalExpenses + recurringTotal + subscriptionsTotal;
  const remainingBudget = totalIncome - totalMonthlyExpenses;
  const upcomingPayments = recurringPayments.length + subscriptions.length;
  const paidPaymentsCount = paidRecurringIds.length + paidSubscriptionIds.length;

  // Fetch historical data for chart (last 12 months)
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  // Get all expenses for the last 12 months
  const historicalExpenses = await db.extraExpense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: twelveMonthsAgo,
      },
    },
    select: {
      date: true,
      amount: true,
      currency: true,
    },
  });

  // Build chart data - aggregate by month
  const chartDataMap: Record<string, { income: number; expenses: number }> = {};
  
  // Initialize last 12 months with zeros
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(monthDate);
    chartDataMap[key] = { income: 0, expenses: 0 };
  }

  // Add income (assuming it's recurring, add to all months)
  // This is a simplified approach - for production, you'd want to track actual income received
  const monthlyIncome = totalIncome; // Already converted to base currency
  Object.keys(chartDataMap).forEach(key => {
    chartDataMap[key].income = monthlyIncome;
  });

  // Add expenses to their respective months (converted to base currency)
  historicalExpenses.forEach(exp => {
    const key = getMonthKey(exp.date);
    if (chartDataMap[key]) {
      const result = convertCurrencyWithInfo(exp.amount, exp.currency, baseCurrency, rates);
      chartDataMap[key].expenses += result.amount;
    }
  });

  // Add recurring payments and subscriptions to each month
  const monthlyRecurring = recurringTotal + subscriptionsTotal;
  Object.keys(chartDataMap).forEach(key => {
    chartDataMap[key].expenses += monthlyRecurring;
  });

  // Convert to array for chart (convert from storage to display amounts)
  const chartData: ChartDataPoint[] = Object.entries(chartDataMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      income: toDisplayAmount(data.income, baseCurrency),
      expenses: toDisplayAmount(data.expenses, baseCurrency),
    }));

  return (
    <div className="flex flex-col gap-6">
      <ConversionWarnings warnings={conversionWarnings} />
      <DashboardHeader />
      
      <BudgetCards
        totalIncome={totalIncome}
        totalExpenses={totalMonthlyExpenses}
        remainingBudget={remainingBudget}
        upcomingPayments={upcomingPayments}
        paidPaymentsCount={paidPaymentsCount}
        currency={baseCurrency}
        incomes={incomes}
        expenses={expenses}
        recurringPayments={recurringPayments}
        subscriptions={subscriptions}
        // Converted totals for expense breakdown
        extraExpensesTotal={totalExpenses}
        recurringTotal={recurringTotal}
        subscriptionsTotal={subscriptionsTotal}
        // Payment status
        paidRecurringIds={paidRecurringIds}
        paidSubscriptionIds={paidSubscriptionIds}
      />

      {/* Charts Row - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive data={chartData} currency={baseCurrency} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <ChartExpenseBreakdown
            recurringTotal={toDisplayAmount(recurringTotal, baseCurrency)}
            subscriptionsTotal={toDisplayAmount(subscriptionsTotal, baseCurrency)}
            extraExpensesTotal={toDisplayAmount(totalExpenses, baseCurrency)}
            currency={baseCurrency}
            periodStart={start}
          />
          <ChartIncomeSources
            incomes={incomes.map(inc => ({
              id: inc.id,
              name: inc.name,
              amount: toDisplayAmount(convertCurrencyWithInfo(inc.amount, inc.currency, baseCurrency, rates).amount, baseCurrency),
              currency: baseCurrency,
            }))}
            totalIncome={toDisplayAmount(totalIncome, baseCurrency)}
            currency={baseCurrency}
            periodStart={start}
          />
        </div>
      </div>

      <ChartProjections 
        data={await getProjections()} 
        currency={baseCurrency} 
      />

      <RecentTransactions 
        expenses={expenses}
        recurringPayments={recurringPayments}
        subscriptions={subscriptions}
        paidRecurringIds={paidRecurringIds}
        paidSubscriptionIds={paidSubscriptionIds}
      />
    </div>
  );
}
