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
import { Divider, Grid, Paper, Table, TableBody, TableContainer, TableHead, Typography } from '@mui/material';

export type ProductProps = {
  productID: number;
  name: string;
  description: string;
  SKU: string;
  price: number;
  quantity: number;
  image_path?: string;
  variations?: { option: string; values: { title: string; price: number; sku: string; quantity: number }[]; type?: string }[];
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
  const [productVariations, setProductVariations] = useState<{ option: string; values: { title: string; price: number; sku: string; quantity: number }[]; type?: string }[]>(row.variations || []);
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
    setEditedProduct({
        name: row.name,
        description: row.description,
        SKU: row.SKU,
        price: row.price,
        quantity: row.quantity
    });
    setOpenEditDialog(true);
    handleClosePopover();

    try {
        // Fetch categories
        const categoryRes = await axios.get("http://localhost:8000/view-categories", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(categoryRes.data.Categories);

        // Fetch assigned categories
        const assignedCategoriesRes = await axios.get(`http://localhost:8000/get-product-categories/${row.productID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedCategories(assignedCategoriesRes.data.assignedCategories);

        // Fetch product variations (options and values)
        
        const response = await axios.get(`http://localhost:8000/get-product-variations/${row.productID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        console.log("Product Variations:", response.data);
        console.log(response.data.variations);
        setProductVariations(response.data.variations);  
    } catch (err) {
        console.error("Failed to fetch product details", err);
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

  const handleVariationChange = (index: number, key: string, value: string) => {
    const updatedVariations = [...productVariations];
  
    if (key === "option") {
      // Update the option title
      updatedVariations[index].option = value;
    } else if (key === "type") {
      // Update the option type without modifying the values
      updatedVariations[index].type = value;
    }
  
    setProductVariations(updatedVariations);
  };
  
  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
      const updatedVariations = [...productVariations];
      updatedVariations[optionIndex].values = updatedVariations[optionIndex].values.filter(
        (_, index) => index !== valueIndex
      );
      setProductVariations(updatedVariations);
    };

  const handleValueChange = (optionIndex: number, valueIndex: number, key: string, value: string | number) => {
      const updatedVariations = [...productVariations];
      const updatedValues = [...updatedVariations[optionIndex].values];
      if (typeof updatedValues[valueIndex] === 'object') {
        updatedValues[valueIndex] = { ...updatedValues[valueIndex], [key]: value };
      } else {
        updatedValues[valueIndex] = {
          title: typeof value === 'string' ? value : '',
          price: 0,
          sku: '',
          quantity: 0,
        };
      }
      updatedVariations[optionIndex].values = updatedValues;
      setProductVariations(updatedVariations);
    };
  
  const handleAddVariation = () => {
    setProductVariations([...productVariations, { option: "", values: [] }]);
  };
  
  const handleRemoveVariation = (index: number) => {
    setProductVariations(productVariations.filter((_, i) => i !== index));
  };

  const handleAddValue = (optionIndex: number) => {
    const updatedVariations = [...productVariations];
    updatedVariations[optionIndex].values.push({
      title: "",
      price: 0,
      sku: "",
      quantity: 0,
    });
    setProductVariations(updatedVariations);
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
      console.log("Edited Product:", editedProduct);
      console.log("Selected Categories:", selectedCategories);
      console.log("Product Variations:", productVariations);
  
      const formData = new FormData();
      formData.append("name", editedProduct.name);
      formData.append("description", editedProduct.description);
      formData.append("SKU", editedProduct.SKU);
      formData.append("price", editedProduct.price.toString());
      formData.append("quantity", editedProduct.quantity?.toString() || "");
  
      selectedCategories.forEach((categoryID) => formData.append("category_ids", categoryID.toString()));
  
      // Serialize variations into a JSON string
      const serializedVariations = JSON.stringify(productVariations);
      formData.append("variations", serializedVariations);
  
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
  
      console.log("FormData:", formData);
  
      const response = await axios.put(
        `http://localhost:8000/update-product/${row.productID}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        }
      );
  
      console.log("Update Response:", response.data);
  
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

<Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth maxWidth="lg">
  <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold'}}>Edit Product</DialogTitle>
  <DialogContent sx={{ padding: 4}}>

    <Grid sx={{marginTop:0}} container spacing={3}>
      {/* Product Details */}
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={editedProduct.name}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Description"
          name="description"
          value={editedProduct.description}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="SKU"
          name="SKU"
          value={editedProduct.SKU}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Price"
          name="price"
          type="number"
          value={editedProduct.price}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Quantity"
          name="quantity"
          type="number"
          value={editedProduct.quantity}
          onChange={handleInputChange}
        />
      </Grid>

      {/* Category Selection */}
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Categories</InputLabel>
          <Select
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
            renderValue={(selected) =>
              selected.map((id) => categories.find((cat) => cat.categoryID === id)?.name).join(", ")
            }
          >
            {categories.map((category) => (
              <MenuItem key={category.categoryID} value={category.categoryID}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Image Upload */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Upload Product Image
        </Typography>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            style={{ width: "100%", maxHeight: "300px", marginTop: "10px", objectFit: "contain" }}
          />
        )}
      </Grid>
    </Grid>

    {/* Product Variations Section */}
    <Divider sx={{ marginY: 3 }} />
    <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
      Product Variations
    </Typography>
    <Paper elevation={3} sx={{ padding: 3 }}>
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Option Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Values</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {productVariations.map((option, optionIndex) => (
    <TableRow key={optionIndex}>
      {/* Option Title */}
      <TableCell>
        <TextField
          fullWidth
          size="small"
          label="Option Title"
          value={option.option}
          onChange={(e) => handleVariationChange(optionIndex, "option", e.target.value)}
        />
      </TableCell>

      {/* Option Type */}
      <TableCell>
        <Select
          fullWidth
          size="small"
          value={option.type || "dropdown"}
          onChange={(e) => handleVariationChange(optionIndex, "type", e.target.value)}
        >
          <MenuItem value="dropdown">Dropdown</MenuItem>
          <MenuItem value="radio">Radio Button</MenuItem>
        </Select>
      </TableCell>

      {/* Option Values */}
      <TableCell>
        {option.values.map((value, valueIndex) => (
          <Box
            key={valueIndex}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginBottom: 2,
            }}
          >
            <TextField
              size="small"
              label="Title"
              value={value.title}
              onChange={(e) =>
                handleValueChange(optionIndex, valueIndex, "title", e.target.value)
              }
              sx={{ width: '30%' }}
            />
            <TextField
              size="small"
              label="Price"
              type="number"
              value={value.price || ""}
              onChange={(e) =>
                handleValueChange(optionIndex, valueIndex, "price", e.target.value)
              }
              sx={{ width: '25%' }}
            />
            <TextField
              size="small"
              label="SKU"
              value={value.sku}
              onChange={(e) =>
                handleValueChange(optionIndex, valueIndex, "sku", e.target.value)
              }
              sx={{ width: '20%' }}
            />
            <TextField
              size="small"
              label="Quantity"
              type="number"
              value={value.quantity}
              onChange={(e) =>
                handleValueChange(optionIndex, valueIndex, "quantity", e.target.value)
              }
              sx={{ width: '20%' }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleRemoveValue(optionIndex, valueIndex)} // Remove individual value
            >
              Remove
            </Button>
          </Box>
        ))}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleAddValue(optionIndex)} // Add value to the current option
          >
            Add Value
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleRemoveVariation(optionIndex)} // Remove the entire option
          >
            Remove Option
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
        <Button onClick={handleAddVariation} variant="contained">
          Add New Option
        </Button>
      </Box>
    </Paper>
  </DialogContent>

  <DialogActions sx={{ padding: 3 }}>
    <Button onClick={handleCloseEditDialog} color="error" variant="outlined">
      Cancel
    </Button>
    <Button onClick={handleSaveEdit} variant="contained" color="primary">
      Save Changes
    </Button>
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
