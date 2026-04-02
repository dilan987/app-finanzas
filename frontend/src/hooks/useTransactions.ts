import { useEffect } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import type { TransactionFilters } from '../types';

export function useTransactions(filters?: TransactionFilters) {
  const {
    transactions,
    pagination,
    loading,
    selectedTransaction,
    monthlyStats,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    setSelectedTransaction,
    fetchMonthlyStats,
  } = useTransactionStore();

  useEffect(() => {
    if (filters) {
      setFilters(filters);
    }
    void fetchTransactions(filters);
  }, [
    filters?.page,
    filters?.limit,
    filters?.type,
    filters?.categoryId,
    filters?.paymentMethod,
    filters?.startDate,
    filters?.endDate,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.search,
    fetchTransactions,
    setFilters,
  ]);

  return {
    transactions,
    pagination,
    loading,
    selectedTransaction,
    monthlyStats,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    setSelectedTransaction,
    fetchMonthlyStats,
    refetch: fetchTransactions,
  };
}
