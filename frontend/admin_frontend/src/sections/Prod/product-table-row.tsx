import { useState, useCallback, useEffect } from 'react';
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
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { SelectChangeEvent } from '@mui/material/Select';

import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/contexts/AuthContext';

export type ProductProps = {
  productID: number;
  name: string;
  description: string;
  SKU: string;
  price: number;
  quantity: number;
  image_path?: string; 
};

type ProductTableRowProps = {
  row: ProductProps;
  selected: boolean;
  onSelectRow: () => void;
  onUserUpdated: () => void; // Callback to refresh user list after update or delete
};

export function UserTableRow({ row, selected, onSelectRow, onUserUpdated }: ProductTableRowProps) {
  const { user, token } = useAuth(); // Get authenticated user data
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ name: row.name, description: row.description, SKU: row.SKU, price: row.price, quantity: row.quantity });
  const [categories, setCategories] = useState<{ categoryID: number; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(row.image_path ? `http://localhost:8000${row.image_path}` : null);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
  
      // Preview the selected image
      const objectURL = URL.createObjectURL(event.target.files[0]);
      setPreviewImage(objectURL);
    }
  };

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleOpenEditDialog = async () => {
    setEditedProduct({ name: row.name, description: row.description, SKU: row.SKU, price: row.price, quantity: row.quantity });
    setOpenEditDialog(true);
    handleClosePopover();

    // Fetch categories
    try {
      const response = await axios.get("http://localhost:8000/view-categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.Categories);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }

    // Fetch assigned categories
    try {
      const response = await axios.get(`http://localhost:8000/get-product-categories/${row.productID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCategories(response.data.assignedCategories);
    } catch (err) {
      console.error("Failed to fetch assigned categories", err);
    }
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
    setEditedProduct({ ...editedProduct, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedCategories(event.target.value as number[]);
  };

  // Fetch product categories
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/get-product-categories/${row.productID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const categoryNames = response.data.assignedCategories.map((categoryID: number) => {
          const category = categories.find((cat) => cat.categoryID === categoryID);
          return category ? category.name : '';
        });
        setProductCategories(categoryNames);
      } catch (err) {
        console.error("Failed to fetch product categories", err);
      }
    };

    if (categories.length > 0) {
      fetchProductCategories();
    }
  }, [row.productID, categories, token]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:8000/view-categories", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data.Categories);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, [token]);

  // Update product API call
  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", editedProduct.name);
      formData.append("description", editedProduct.description);
      formData.append("SKU", editedProduct.SKU);
      formData.append("price", editedProduct.price.toString());
      formData.append("quantity", editedProduct.quantity?.toString() || "");
      selectedCategories.forEach((categoryID) => formData.append("category_ids", categoryID.toString()));
  
      // Append image only if a new one is selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
  
      await axios.put(
        `http://localhost:8000/update-product/${row.productID}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        }
      );
  
      // ✅ Update the preview image immediately by appending a timestamp
      if (selectedImage) {
        setPreviewImage(`http://localhost:8000/assets/images/${row.productID}_${selectedImage.name}?t=${new Date().getTime()}`);
      }
  
      onUserUpdated(); // Refresh product list after update
      handleCloseEditDialog();
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
    }
  };
  
  

  // Delete product API call
  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`http://localhost:8000/delete-product/${row.productID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUserUpdated(); // Refresh user list after deletion
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
  <TableCell padding="checkbox">
    <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
  </TableCell>
  <TableCell>{row.productID}</TableCell>
  <TableCell>
  <Box display="flex" alignItems="center" gap={2}>
    {row.image_path ? (
      <Avatar
        src={`http://localhost:8000${row.image_path}?t=${new Date().getTime()}`}
        alt={row.name}
        sx={{ width: 50, height: 50 }}
      />
    ) : (
      <Avatar sx={{ width: 50, height: 50 }}>N/A</Avatar>
    )}
    {row.name}
  </Box>
</TableCell>
  <TableCell>{row.description}</TableCell>
  <TableCell>{row.SKU}</TableCell>
  <TableCell>{row.price}</TableCell>
  <TableCell>{row.quantity}</TableCell>
  <TableCell>{productCategories.join(', ')}</TableCell>

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

      {/* Edit Product Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
  <DialogTitle>Edit Product</DialogTitle>
  <DialogContent>
    <TextField fullWidth margin="normal" label="Name" name="name" value={editedProduct.name} onChange={handleInputChange} />
    <TextField fullWidth margin="normal" label="Description" name="description" value={editedProduct.description} onChange={handleInputChange} />
    <TextField fullWidth margin="normal" label="SKU" name="SKU" value={editedProduct.SKU} onChange={handleInputChange} />
    <TextField fullWidth margin="normal" label="Price" name="price" value={editedProduct.price} onChange={handleInputChange} />
    <TextField fullWidth margin="normal" label="Quantity" name="quantity" value={editedProduct.quantity} onChange={handleInputChange} />

    <FormControl fullWidth margin="normal">
      <InputLabel>Categories</InputLabel>
      <Select
        multiple
        value={selectedCategories}
        onChange={handleCategoryChange}
        renderValue={(selected) => selected.map((id) => categories.find((cat) => cat.categoryID === id)?.name).join(', ')}
      >
        {categories.map((category) => (
          <MenuItem key={category.categoryID} value={category.categoryID}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* ✅ Display Image Preview */}
    {previewImage && <img src={previewImage} alt="Product Preview" style={{ width: "100px", height: "100px", marginTop: "10px" }} />}

    {/* ✅ Image Upload Field */}
    <Button variant="contained" component="label" sx={{ mt: 2 }}>
      Upload New Image
      <input type="file" hidden accept="image/*" onChange={handleImageChange} />
    </Button>

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
          <Button onClick={handleDeleteProduct} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
