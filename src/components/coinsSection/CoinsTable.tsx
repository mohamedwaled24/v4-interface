import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number,
  ) => void;
}

interface CoinData {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  priceUsd: string;
  marketCapUsd: string;
  changePercent24Hr: string;
}

interface CustomPaginationActionsTableProps {
  coins: CoinData[];
  loading?: boolean;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

const formatPrice = (price: string) => {
  const num = parseFloat(price);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

const formatMarketCap = (marketCap: string) => {
  const num = parseFloat(marketCap);
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else {
    return `$${num.toFixed(2)}`;
  }
};

const formatChange = (change: string) => {
  const num = parseFloat(change);
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export default function CustomPaginationActionsTable({ coins, loading }: CustomPaginationActionsTableProps) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [orderBy, setOrderBy] = React.useState<keyof CoinData>('rank');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');

  // Comparison function for sorting
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    const aVal = a[orderBy];
    const bVal = b[orderBy];
    
    // Handle numeric values (convert string to number for comparison)
    if (orderBy === 'rank' || orderBy === 'priceUsd' || orderBy === 'marketCapUsd' || orderBy === 'changePercent24Hr') {
      const aNum = parseFloat(aVal as string);
      const bNum = parseFloat(bVal as string);
      if (bNum < aNum) return -1;
      if (bNum > aNum) return 1;
      return 0;
    }
    
    // Handle string values
    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: 'asc' | 'desc',
    orderBy: Key,
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Handle sort request
  const handleRequestSort = (property: keyof CoinData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort the coins data
  const sortedCoins = React.useMemo(() => {
    return [...coins].sort(getComparator(order, orderBy));
  }, [coins, order, orderBy]);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedCoins.length) : 0;

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <Box sx={{ p: 4, textAlign: 'center' }}>
          Loading coins data...
        </Box>
      </TableContainer>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Table sx={{ minWidth: 500 }} aria-label="cryptocurrency table">
        <TableHead
          sx={{
            background:
              "linear-gradient(to right, rgba(242, 19, 255, 0.5), rgba(20, 212, 223, 0.5))",
          }}
        >
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", color: "#341e55ff" }}>
              <TableSortLabel
                active={orderBy === "rank"}
                direction={orderBy === "rank" ? order : "asc"}
                onClick={() => handleRequestSort("rank")}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiTableSortLabel-icon": {
                    color: "#341e55ff !important",
                  },
                }}
              >
                Rank
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#341e55ff" }}>
              <TableSortLabel
                active={orderBy === "name"}
                direction={orderBy === "name" ? order : "asc"}
                onClick={() => handleRequestSort("name")}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiTableSortLabel-icon": {
                    color: "#341e55ff !important",
                  },
                }}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "#341e55ff" }}
              align="right"
            >
              <TableSortLabel
                active={orderBy === "priceUsd"}
                direction={orderBy === "priceUsd" ? order : "asc"}
                onClick={() => handleRequestSort("priceUsd")}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiTableSortLabel-icon": {
                    color: "#341e55ff !important",
                  },
                  flexDirection: "row-reverse",
                }}
              >
                Price
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "#341e55ff" }}
              align="right"
            >
              <TableSortLabel
                active={orderBy === "marketCapUsd"}
                direction={orderBy === "marketCapUsd" ? order : "asc"}
                onClick={() => handleRequestSort("marketCapUsd")}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiTableSortLabel-icon": {
                    color: "#341e55ff !important",
                  },
                  flexDirection: "row-reverse",
                }}
              >
                Market Cap
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "#341e55ff" }}
              align="right"
            >
              <TableSortLabel
                active={orderBy === "changePercent24Hr"}
                direction={orderBy === "changePercent24Hr" ? order : "asc"}
                onClick={() => handleRequestSort("changePercent24Hr")}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiTableSortLabel-icon": {
                    color: "#341e55ff !important",
                  },
                  flexDirection: "row-reverse",
                }}
              >
                24h Change
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0
            ? sortedCoins.slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage
              )
            : sortedCoins
          ).map((coin) => (
            <TableRow
              key={coin.id}
              sx={{
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.5)" },
              }}
            >
              <TableCell component="th" scope="row" sx={{ color: "#341e55ff" }}>
                {coin.rank}
              </TableCell>
              <TableCell sx={{ color: "#341e55ff" }}>
                <Box>
                  <Box sx={{ fontWeight: "bold" }}>{coin.name}</Box>
                  <Box sx={{ fontSize: "0.875rem", color: "#666" }}>
                    {coin.symbol}
                  </Box>
                </Box>
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: "#341e55ff", fontWeight: "bold" }}
              >
                {formatPrice(coin.priceUsd)}
              </TableCell>
              <TableCell align="right" sx={{ color: "#341e55ff" }}>
                {formatMarketCap(coin.marketCapUsd)}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color:
                    parseFloat(coin.changePercent24Hr) >= 0
                      ? "#22c55e"
                      : "#ef4444",
                  fontWeight: "bold",
                }}
              >
                {formatChange(coin.changePercent24Hr)}
              </TableCell>
            </TableRow>
          ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
              colSpan={5}
              count={sortedCoins.length}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: {
                    "aria-label": "rows per page",
                  },
                  native: true,
                },
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}