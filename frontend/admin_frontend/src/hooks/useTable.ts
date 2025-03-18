import { useState } from 'react';

export function useTable() {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  return {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    onSort: (newOrderBy: string) => {
      setOrder(order === 'asc' ? 'desc' : 'asc');
      setOrderBy(newOrderBy);
    },
    onSelectRow: (id: string) => {
      setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    },
    onSelectAllRows: (checked: boolean, ids: string[]) => {
      setSelected(checked ? ids : []);
    },
    onChangePage: (event: unknown, newPage: number) => {
      setPage(newPage);
    },
    onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    onResetPage: () => setPage(0),
  };
}
