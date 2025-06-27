import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreditCard,
  CreditCardPayment,
  CreditCardSummaryData,
} from '../types/creditCard';
import { utilizationMonitoringService } from '../services/notifications/UtilizationMonitoringService';

const CARDS_STORAGE_KEY = '@clarifi_credit_cards';
const PAYMENTS_STORAGE_KEY = '@clarifi_credit_card_payments';
const CACHE_EXPIRY_HOURS = 1;

interface UseCreditCardsReturn {
  cards: CreditCard[] | null;
  payments: CreditCardPayment[] | null;
  loading: boolean;
  error: string | null;
  totalCreditLimit: number;
  totalCurrentBalance: number;
  totalAvailableCredit: number;
  totalUtilization: number;
  averageUtilization: number;
  summaryData: CreditCardSummaryData | null;
  refreshCards: () => Promise<void>;
  addCard: (
    card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateCard: (id: string, updates: Partial<CreditCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addPayment: (
    payment: Omit<CreditCardPayment, 'id' | 'createdAt'>
  ) => Promise<string>;
  getCardPayments: (cardId: string) => CreditCardPayment[];
  clearAllData: () => Promise<void>;
  triggerTestAlert: () => Promise<void>;
}

export const useCreditCards = (): UseCreditCardsReturn => {
  const [cards, setCards] = useState<CreditCard[] | null>(null);
  const [payments, setPayments] = useState<CreditCardPayment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cardsData, paymentsData] = await Promise.all([
        AsyncStorage.getItem(CARDS_STORAGE_KEY),
        AsyncStorage.getItem(PAYMENTS_STORAGE_KEY),
      ]);

      let loadedCards: CreditCard[] = [];
      let loadedPayments: CreditCardPayment[] = [];

      if (cardsData) {
        const parsedCardsData = JSON.parse(cardsData);
        if (parsedCardsData.data && Array.isArray(parsedCardsData.data)) {
          loadedCards = parsedCardsData.data;
        }
      }

      if (paymentsData) {
        const parsedPaymentsData = JSON.parse(paymentsData);
        if (parsedPaymentsData.data && Array.isArray(parsedPaymentsData.data)) {
          loadedPayments = parsedPaymentsData.data;
        }
      }

      // If no data exists, create sample data for development
      if (loadedCards.length === 0) {
        loadedCards = generateSampleCards();
        await saveCardsToStorage(loadedCards);
      }

      setCards(loadedCards);
      setPayments(loadedPayments);
    } catch (err) {
      console.error('Failed to load credit cards:', err);
      setError('Failed to load credit card data');

      // Fallback to sample data
      const sampleCards = generateSampleCards();
      setCards(sampleCards);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save cards to AsyncStorage
  const saveCardsToStorage = async (cardsToSave: CreditCard[]) => {
    try {
      const dataToStore = {
        data: cardsToSave,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000
        ).toISOString(),
      };
      await AsyncStorage.setItem(
        CARDS_STORAGE_KEY,
        JSON.stringify(dataToStore)
      );
    } catch (err) {
      console.error('Failed to save cards to storage:', err);
      throw new Error('Failed to save credit card data');
    }
  };

  // Save payments to AsyncStorage
  const savePaymentsToStorage = async (paymentsToSave: CreditCardPayment[]) => {
    try {
      const dataToStore = {
        data: paymentsToSave,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000
        ).toISOString(),
      };
      await AsyncStorage.setItem(
        PAYMENTS_STORAGE_KEY,
        JSON.stringify(dataToStore)
      );
    } catch (err) {
      console.error('Failed to save payments to storage:', err);
      throw new Error('Failed to save payment data');
    }
  };

  // Generate sample cards for development
  const generateSampleCards = (): CreditCard[] => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    const statementDate = new Date(now.getFullYear(), now.getMonth(), 20);

    return [
      {
        id: '1',
        name: 'RBC Rewards Visa',
        lastFourDigits: '1234',
        issuer: 'rbc',
        creditLimit: 5000,
        currentBalance: 1250,
        availableCredit: 3750,
        paymentDueDate: nextMonth.toISOString(),
        statementDate: statementDate.toISOString(),
        interestRate: 19.99,
        minimumPayment: 62.5,
        isActive: true,
        createdAt: new Date(2024, 0, 15).toISOString(),
        updatedAt: now.toISOString(),
        color: '#003DA5',
        notes: 'Primary rewards card',
      },
      {
        id: '2',
        name: 'TD Cash Back Visa',
        lastFourDigits: '5678',
        issuer: 'td',
        creditLimit: 3000,
        currentBalance: 450,
        availableCredit: 2550,
        paymentDueDate: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          10
        ).toISOString(),
        statementDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          15
        ).toISOString(),
        interestRate: 20.99,
        minimumPayment: 22.5,
        isActive: true,
        createdAt: new Date(2024, 2, 10).toISOString(),
        updatedAt: now.toISOString(),
        color: '#00B04F',
        notes: 'Cash back on groceries',
      },
      {
        id: '3',
        name: 'Scotiabank Scene+ Visa',
        lastFourDigits: '9012',
        issuer: 'scotiabank',
        creditLimit: 2500,
        currentBalance: 2100,
        availableCredit: 400,
        paymentDueDate: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          25
        ).toISOString(),
        statementDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          28
        ).toISOString(),
        interestRate: 21.99,
        minimumPayment: 105.0,
        isActive: true,
        createdAt: new Date(2023, 8, 5).toISOString(),
        updatedAt: now.toISOString(),
        color: '#E31837',
        notes: 'Movie rewards card',
      },
    ];
  };

  // Refresh data
  const refreshCards = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Add new card
  const addCard = async (
    cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const newCard: CreditCard = {
        ...cardData,
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        availableCredit: cardData.creditLimit - cardData.currentBalance,
        minimumPayment: Math.max(25, cardData.currentBalance * 0.025), // 2.5% minimum or $25
      };

      const updatedCards = [...(cards || []), newCard];
      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      return newCard.id;
    } catch (err) {
      console.error('Failed to add card:', err);
      throw new Error('Failed to add credit card');
    }
  };

  // Update existing card
  const updateCard = async (
    id: string,
    updates: Partial<CreditCard>
  ): Promise<void> => {
    try {
      if (!cards) throw new Error('No cards loaded');

      const updatedCards = cards.map(card => {
        if (card.id === id) {
          const updatedCard = {
            ...card,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          // Recalculate available credit and minimum payment
          updatedCard.availableCredit =
            updatedCard.creditLimit - updatedCard.currentBalance;
          updatedCard.minimumPayment = Math.max(
            25,
            updatedCard.currentBalance * 0.025
          );

          return updatedCard;
        }
        return card;
      });

      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);
    } catch (err) {
      console.error('Failed to update card:', err);
      throw new Error('Failed to update credit card');
    }
  };

  // Delete card
  const deleteCard = async (id: string): Promise<void> => {
    try {
      if (!cards) throw new Error('No cards loaded');

      const updatedCards = cards.filter(card => card.id !== id);
      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Also remove associated payments
      if (payments) {
        const updatedPayments = payments.filter(
          payment => payment.cardId !== id
        );
        setPayments(updatedPayments);
        await savePaymentsToStorage(updatedPayments);
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
      throw new Error('Failed to delete credit card');
    }
  };

  // Add payment
  const addPayment = async (
    paymentData: Omit<CreditCardPayment, 'id' | 'createdAt'>
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const newPayment: CreditCardPayment = {
        ...paymentData,
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
      };

      const updatedPayments = [...(payments || []), newPayment];
      setPayments(updatedPayments);
      await savePaymentsToStorage(updatedPayments);

      // Update the card balance
      if (cards) {
        const cardToUpdate = cards.find(card => card.id === paymentData.cardId);
        if (cardToUpdate) {
          await updateCard(paymentData.cardId, {
            currentBalance: Math.max(
              0,
              cardToUpdate.currentBalance - paymentData.amount
            ),
          });
        }
      }

      return newPayment.id;
    } catch (err) {
      console.error('Failed to add payment:', err);
      throw new Error('Failed to add payment');
    }
  };

  // Get payments for a specific card
  const getCardPayments = (cardId: string): CreditCardPayment[] => {
    if (!payments) return [];
    return payments
      .filter(payment => payment.cardId === cardId)
      .sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
  };

  // Clear all data
  const clearAllData = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CARDS_STORAGE_KEY),
        AsyncStorage.removeItem(PAYMENTS_STORAGE_KEY),
      ]);
      setCards([]);
      setPayments([]);
    } catch (err) {
      console.error('Failed to clear data:', err);
      throw new Error('Failed to clear data');
    }
  };

  // Trigger test alert for demo purposes
  const triggerTestAlert = async (): Promise<void> => {
    if (cards && cards.length > 0) {
      await utilizationMonitoringService.triggerTestAlert(cards);
    }
  };

  // Calculate summary data
  const calculateSummaryData = (): CreditCardSummaryData => {
    if (!cards || cards.length === 0) {
      return {
        totalCreditLimit: 0,
        totalCurrentBalance: 0,
        totalAvailableCredit: 0,
        averageUtilization: 0,
        totalUtilization: 0,
        cardCount: 0,
        upcomingPayments: 0,
        overUtilizedCards: 0,
      };
    }

    const totalCreditLimit = cards.reduce(
      (sum, card) => sum + card.creditLimit,
      0
    );
    const totalCurrentBalance = cards.reduce(
      (sum, card) => sum + card.currentBalance,
      0
    );
    const totalAvailableCredit = totalCreditLimit - totalCurrentBalance;
    const totalUtilization =
      totalCreditLimit > 0 ? (totalCurrentBalance / totalCreditLimit) * 100 : 0;

    const utilizationsByCard = cards.map(card =>
      card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0
    );
    const averageUtilization =
      utilizationsByCard.length > 0
        ? utilizationsByCard.reduce((sum, util) => sum + util, 0) /
          utilizationsByCard.length
        : 0;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPayments = cards.filter(card => {
      const dueDate = new Date(card.paymentDueDate);
      return dueDate <= sevenDaysFromNow && dueDate >= now;
    }).length;

    const overUtilizedCards = cards.filter(card => {
      const utilization =
        card.creditLimit > 0
          ? (card.currentBalance / card.creditLimit) * 100
          : 0;
      return utilization > 80;
    }).length;

    return {
      totalCreditLimit,
      totalCurrentBalance,
      totalAvailableCredit,
      averageUtilization,
      totalUtilization,
      cardCount: cards.length,
      upcomingPayments,
      overUtilizedCards,
    };
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Monitor utilization when cards change
  useEffect(() => {
    if (cards && cards.length > 0) {
      // Check utilization alerts after a short delay to allow UI to settle
      const timer = setTimeout(() => {
        utilizationMonitoringService.checkUtilizationAlerts(cards);
        utilizationMonitoringService.checkPaymentReminders(cards);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [cards]);

  const summaryData = calculateSummaryData();

  return {
    cards,
    payments,
    loading,
    error,
    totalCreditLimit: summaryData.totalCreditLimit,
    totalCurrentBalance: summaryData.totalCurrentBalance,
    totalAvailableCredit: summaryData.totalAvailableCredit,
    totalUtilization: summaryData.totalUtilization,
    averageUtilization: summaryData.averageUtilization,
    summaryData,
    refreshCards,
    addCard,
    updateCard,
    deleteCard,
    addPayment,
    getCardPayments,
    clearAllData,
    triggerTestAlert,
  };
};
