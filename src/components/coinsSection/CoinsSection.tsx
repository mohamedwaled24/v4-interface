import React, { useEffect, useState } from 'react';
import styled from "styled-components";
import CustomPaginationActionsTable from './CoinsTable';
import CardsWidget from './CardsWidget';

const Container = styled.section`
  width: 100%;
  padding: 8px;
  border-radius: 30px;
  background: linear-gradient(135deg, #f4efff, #e0d4ff);
`;

const ContainerStruct = styled.div`
  display: flex;
  flex-direction: column;
  align-items:center;
  justify-content:center;
  gap: 8px;
  max-width: 1200px;
  padding:0;
  margin: 0 auto;
`;

const ContainerHeader = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: auto;
  padding-top: 8px;
`;

const ContainerTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #341e55ff;
  margin: 0;
`;

interface CoinData {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  priceUsd: string;
  marketCapUsd: string;
  changePercent24Hr: string;
}

const CoinsSection = () => {
  const [loadingTokens, setLoadingTokens] = useState<boolean>(false);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [perPage, setPerPage] = useState<number>(10);
  
  // Note: CoinCap API typically uses v2, not v3. Also, API key might not be required for basic requests
  const apiKey = "e5a70d43011e6ca32c36714af99661b6797be62dcf9f27bf89d7746dd2ba5707";

  useEffect(() => {
    const fetchCoins = async () => {
      setLoadingTokens(true);
      try {
        const response = await fetch(`https://rest.coincap.io/v3/assets?apiKey=${apiKey}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.data) {
          setCoins(result.data);
          console.log("coins data", result.data);
        } else {
          console.error("No data received from API");
        }
      } catch (error) {
        console.error("Error while fetching coins data:", error);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchCoins();
  }, []);

  return (
    <Container>
      <ContainerStruct>
       <CardsWidget />
        <ContainerHeader>
          <ContainerTitle>Cryptocurrency Market</ContainerTitle>
        </ContainerHeader>
        <CustomPaginationActionsTable 
          coins={coins} 
          loading={loadingTokens}
        />
      </ContainerStruct>
    </Container>
  );
};

export default CoinsSection;