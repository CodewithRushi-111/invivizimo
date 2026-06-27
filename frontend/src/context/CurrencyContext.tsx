import React, { createContext, useContext, useState } from 'react';

export interface CurrencyContextType {
  currency: 'USD' | 'INR';
  setCurrency: (c: 'USD' | 'INR') => void;
  formatAmount: (cents: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<'USD' | 'INR'>(() => {
    const saved = localStorage.getItem('invivizmo_currency');
    return (saved === 'USD' || saved === 'INR') ? saved : 'USD';
  });

  const setCurrency = (c: 'USD' | 'INR') => {
    setCurrencyState(c);
    localStorage.setItem('invivizmo_currency', c);
  };

  const formatAmount = (cents: number): string => {
    const amount = cents / 100;
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
export default CurrencyProvider;
