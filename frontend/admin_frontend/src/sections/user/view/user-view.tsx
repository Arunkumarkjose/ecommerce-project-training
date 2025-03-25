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
import { useTable } from 'src/hooks/useTable';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserProps, UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------

export function UserView() {
  const { token, user } = useAuth(); // Get token & role from AuthContext
  const table = useTable();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [users, setUsers] = useState<UserProps[]>([]);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAddUser, setOpenAddUser] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    profile_image:selectedImage
  });

  // Fetch users from API
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/view-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.Users);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Filter users based on search input
  const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(event.target.value);
  };

  const dataFiltered = applyFilter({
    inputData: users,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  // Open/Close Add User Dialog (only for admin)
  const handleOpenAddUser = () => {
    if (user && user.role === 'admin') {
      setOpenAddUser(true);
    } else {
      alert("You do not have permission to add a user.");
    }
  };
  const handleCloseAddUser = () => setOpenAddUser(false);

  // Handle input change for Add User form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // Submit new user (only admin can add)
  const handleAddUser = async () => {
    if (!user || user.role !== 'admin') {
      alert("You do not have permission to add users.");
      return;
    }
  
    const formData = new FormData();
    formData.append("name", newUser.name);
    formData.append("email", newUser.email);
    formData.append("role", newUser.role);
    formData.append("password", newUser.password);
  
    if (selectedImage) {
      formData.append("profile_image", selectedImage); // Attach image file
    }
  
    try {
      const response = await axios.post("http://localhost:8000/add-user", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Required for file upload
        },
      });
  
      fetchUsers(); // Refresh user list
      handleCloseAddUser();
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user");
    }
  };
  

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
  
    try {
      await axios.delete("http://localhost:8000/delete-users", {
        data: { user_ids: selectedUsers }, // Send selected user IDs
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setSelectedUsers([]); // Clear selection
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Failed to delete users:", error);
      alert("Failed to delete users.");
    }
  };

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Users
        </Typography>
        
        {/* Show "New User" button only if the user is an admin */}
        {user && user.role === 'admin' && (
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenAddUser}
          >
            New User
          </Button>
        )}
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
  numSelected={selectedUsers.length}
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
                  rowCount={users.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      users.map((user) => user.userID.toString())
                    )
                  }
                  headLabel={[
                    { id: 'userID', label: 'ID' },
                    { id: 'name', label: 'Name' },
                    { id: 'email', label: 'Email' },
                    { id: 'role', label: 'Role' },
                    { id: 'created_at', label: 'Created At' },
                    { id: '' },
                  ]}
                />
                <TableBody>
  {dataFiltered
    .slice(
      table.page * table.rowsPerPage,
      table.page * table.rowsPerPage + table.rowsPerPage
    )
    .map((row) => (
      <UserTableRow
  key={row.userID}
  row={row}
  selected={selectedUsers.includes(row.userID)}
  onSelectRow={() => {
    setSelectedUsers((prev) =>
      prev.includes(row.userID)
        ? prev.filter((id) => id !== row.userID) // Remove if already selected
        : [...prev, row.userID] // Add if not selected
    );
  }}
  onUserUpdated={fetchUsers} 
/>
    ))}
</TableBody>

              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            component="div"
            page={table.page}
            count={users.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={openAddUser} onClose={handleCloseAddUser}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" name="name" onChange={handleInputChange} />
          <TextField fullWidth margin="normal" label="Email" name="email" type="email" onChange={handleInputChange} />
          <TextField
            select
            fullWidth
            margin="normal"
            label="Role"
            name="role"
            value={newUser.role}
            onChange={handleInputChange}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </TextField>
          {/* Image Upload Input */}
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files) {
          setSelectedImage(e.target.files[0]);
        }
      }} // Store selected image file
      style={{ marginTop: "16px" }}
    />

    {/* Preview Selected Image */}
    {selectedImage && (
      <img
        src={URL.createObjectURL(selectedImage)}
        alt="Preview"
        style={{ width: "100%", maxHeight: "200px", marginTop: "10px", objectFit: "contain" }}
      />
    )}
          <TextField fullWidth margin="normal" label="Password" name="password" type="password" onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddUser} color="error">
            Cancel
          </Button>
          <Button onClick={handleAddUser} variant="contained">
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
