import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTable } from 'src/hooks/useTable';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import {  OrderProps, OrderTableRow } from '../orders-table-row';
import { UserTableHead } from '../orders-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../orders-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------

export function OrdersView() {
  const { token, user } = useAuth(); // Get token & role from AuthContext
  const table = useTable();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');




  // Fetch products from API
  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    console.log("fetching orders");
    try {
      console.log("fetching orders &&");
      const response = await axios.get("http://localhost:8000/admin-view-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
      fetchOrders();
    }, [token]);


  // Filter products based on search input
  const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(event.target.value);
  };

  const dataFiltered = applyFilter({
    inputData: orders,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;


  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
  
    try {
      await axios.delete("http://localhost:8000/delete-products", {
        data: { product_ids: selectedProducts }, // Send selected product IDs
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setSelectedProducts([]); // Clear selection
      fetchOrders(); // Refresh product list
    } catch (err) {
      console.error("Failed to delete products:", err);
      alert("Failed to delete products.");
    }
  };

  const handleSelectAllRows = (checked: boolean) => {
    if (checked) {
      const newSelecteds = orders.map((order) => order.orderID);
      setSelectedProducts(newSelecteds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectRow = (id: number) => {
    const selectedIndex = selectedProducts.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedProducts, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedProducts.slice(1));
    } else if (selectedIndex === selectedProducts.length - 1) {
      newSelected = newSelected.concat(selectedProducts.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedProducts.slice(0, selectedIndex),
        selectedProducts.slice(selectedIndex + 1)
      );
    }

    setSelectedProducts(newSelected);
  };

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Orders
        </Typography>
        
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Card>
          <UserTableToolbar
            numSelected={selectedProducts.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            onDeleteSelected={handleBulkDelete} // Pass the delete function
          />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <UserTableHead
                  order={table.order}
                  orderBy={table.orderBy}
                  rowCount={orders.length}
                  numSelected={selectedProducts.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => handleSelectAllRows(checked)}
                  headLabel={[
                    { id: 'orderID', label: 'Order ID' },
                    { id: 'customerID', label: 'Customer ID' },
                    {id:'customerEmail', label:'Customer Email'},
                    // { id: 'name', label: 'Name' },
                    { id: 'status', label: 'status' },
                    { id: 'amount', label: 'Amount' },
                    { id: 'created_At', label: 'Order Date' },
                    // { id: 'quantity', label: 'Quantity' },
                    // { id: 'categories', label: 'Categories' },
                  ]}
                />
                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <OrderTableRow
                        key={row.orderID}
                        row={row}
                        selected={selectedProducts.includes(row.productID)}
                        onSelectRow={() => handleSelectRow(row.productID)}
                        onUserUpdated={fetchOrders} 
                      />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            component="div"
            page={table.page}
            count={orders.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}
    </DashboardContent>
  );
}
