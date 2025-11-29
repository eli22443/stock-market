"use client";

import { useState, createContext, useContext } from "react";
import { fetchMultiStocksData, type StockRecord } from "../services/api";

type StocksContextValue = {
  stocks: StockRecord[];
  refreshStocks: () => Promise<void>;
};

const StocksContext = createContext<StocksContextValue>({
  stocks: [],
  refreshStocks: async () => {},
});

function StocksProvider({
  children,
  initialStocks,
}: {
  children: React.ReactNode;
  initialStocks: StockRecord[];
}) {
  const [stocks, setStocks] = useState<StockRecord[]>(initialStocks);

  const refreshStocks = async () => {
    const loaded_data = await fetchMultiStocksData();
    setStocks(loaded_data);
  };

  return (
    <StocksContext.Provider value={{ stocks, refreshStocks }}>
      {children}
    </StocksContext.Provider>
  );
}

export { StocksProvider };
export const useStocks = () => useContext(StocksContext);
