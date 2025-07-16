import React, { createContext, useContext, useState, useEffect } from 'react';
import { GRAPHQL_ENDPOINTS } from '../config/graphql';

const PoolsContext = createContext({ allPools: [], poolsLoading: true });

export function PoolsProvider({ children }) {
  const [allPools, setAllPools] = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(true);

  useEffect(() => {
    setPoolsLoading(true);
    fetch(GRAPHQL_ENDPOINTS.all)
      .then(res => res.json())
      .then(data => {
        setAllPools(data.Pool || []);
        setPoolsLoading(false);
      })
      .catch(() => setPoolsLoading(false));
  }, []);

  return (
    <PoolsContext.Provider value={{ allPools, poolsLoading }}>
      {children}
    </PoolsContext.Provider>
  );
}

export function usePools() {
  return useContext(PoolsContext);
} 