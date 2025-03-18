import { useState, useCallback, useEffect } from 'react';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import { useAuth } from 'src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type OrderProps = {
  orderID: number;
  customerID: number;
  status: string;
  address: string;
  customerEmail: string;
  amount: number;
  created_At:string;
};

type OrderTableRowProps = {
  row: OrderProps;
  selected: boolean;
  onSelectRow: () => void;
  onUserUpdated: () => void; // Callback to refresh user list after update or delete
};



export function OrderTableRow({ row, selected, onSelectRow, onUserUpdated }: OrderTableRowProps) {
  const navigate = useNavigate(); // ✅ Hook to navigate
  return (
    <TableRow 
      hover 
      tabIndex={-1} 
      role="checkbox" 
      selected={selected} 
      onClick={() => navigate(`/admin/orders/${row.orderID}`)} // ✅ Navigate on row click
      style={{ cursor: "pointer" }}
    >
      <TableCell padding="checkbox">
        <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
      </TableCell>
      <TableCell>{row.orderID}</TableCell>
      <TableCell>{row.customerID}</TableCell>
      <TableCell>{row.customerEmail}</TableCell>
      <TableCell>{row.status}</TableCell>
      <TableCell>{row.amount}</TableCell>
      <TableCell>{row.created_At}</TableCell>
    </TableRow>
  );
}

