import { useState, useCallback } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItemSelect from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/contexts/AuthContext';

export type UserProps = {
  userID: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  onUserUpdated: () => void; // Callback to refresh user list after update or delete
};

export function UserTableRow({ row, selected, onSelectRow, onUserUpdated }: UserTableRowProps) {
  const { user, token } = useAuth(); // Get authenticated user data
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: row.name, email: row.email, role: row.role, password: '' });

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleOpenEditDialog = () => {
    setEditedUser({ name: row.name, email: row.email, role: row.role, password: '' });
    setOpenEditDialog(true);
    handleClosePopover();
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
    handleClosePopover();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  // Update user API call
  const handleSaveEdit = async () => {
    try {
      const updatedData: { name: string; email: string; role: string; password?: string } = { 
        name: editedUser.name, 
        email: editedUser.email, 
        role: editedUser.role 
      };

      // Only include password if it's not empty
      if (editedUser.password.trim() !== '') {
        updatedData.password = editedUser.password;
      }

      await axios.put(
        `http://localhost:8000/update-user/${row.userID}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUserUpdated(); // Refresh user list after update
      handleCloseEditDialog();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user");
    }
  };

  // Delete user API call
  const handleDeleteUser = async () => {
    try {
      await axios.delete(`http://localhost:8000/delete-user/${row.userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUserUpdated(); // Refresh user list after deletion
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell>{row.userID}</TableCell>
        <TableCell component="th" scope="row">
          <Box gap={2} display="flex" alignItems="center">
            <Avatar alt={row.name} />
            {row.name}
          </Box>
        </TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell>{row.role}</TableCell>
        <TableCell>{row.created_at}</TableCell>

        {user?.role === 'admin' && (
          <TableCell align="right">
            <IconButton onClick={handleOpenPopover}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </TableCell>
        )}
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleOpenEditDialog}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" name="name" value={editedUser.name} onChange={handleInputChange} />
          <TextField fullWidth margin="normal" label="Email" name="email" type="email" value={editedUser.email} onChange={handleInputChange} />
          <TextField select fullWidth margin="normal" label="Role" name="role" value={editedUser.role} onChange={handleInputChange}>
            <MenuItemSelect value="admin">Admin</MenuItemSelect>
            <MenuItemSelect value="sales">Sales</MenuItemSelect>
            <MenuItemSelect value="user">User</MenuItemSelect>
          </TextField>
          <TextField fullWidth margin="normal" label="New Password" name="password" type="password" placeholder="Leave blank to keep current password" value={editedUser.password} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="error">Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to delete {row.name}?</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
