import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
} from "@mui/material";
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
import { ProductProps, UserTableRow } from '../product-table-row';
import { UserTableHead } from '../product-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../product-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------

export function ProductsView() {
  const { token, user } = useAuth(); // Get token & role from AuthContext
  const table = useTable();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [categories, setCategories] = useState<{ categoryID: number; name: string }[]>([]);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    SKU: '',
    price: '',
    quantity: '',
  });

  type ProductOption = {
    title: string;
    type: "radio" | "dropdown"; // Restrict to known types
    required: string;
    values: ProductOptionValue[];
  };
  
  type ProductOptionValue = {
    title: string;
    price: number;
    sku: string;
    quantity: number;
  };

  const [newCategory, setNewCategory] = useState<{
    name: string;
    parentID: number | null;
  }>({
    name: '',
    parentID: null,
  });

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const addOption = () => {
    setProductOptions([...productOptions, { title: "", type: "dropdown", required: "yes", values: [] }]);
  };

  // Add Value to an Option
const addValue = (optionIndex: number) => {
  const newOptions = [...productOptions];
  newOptions[optionIndex].values.push({ title: "", price: 0, sku: "", quantity: 0 });
  setProductOptions(newOptions);
};

// Handle Input Change for Option
const handleOptionChange = (index: number, field: keyof ProductOption, value: any) => {
  setProductOptions((prevOptions) => {
    const updatedOptions = [...prevOptions];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    return updatedOptions;
  });
};

// Handle Input Change for Value
const handleValueChange = (
  optionIndex: number,
  valueIndex: number,
  field: keyof ProductOptionValue,
  value: any
) => {
  setProductOptions((prevOptions) => {
    const updatedOptions = [...prevOptions];
    const updatedValues = [...updatedOptions[optionIndex].values];

    updatedValues[valueIndex] = { ...updatedValues[valueIndex], [field]: value };
    updatedOptions[optionIndex].values = updatedValues;

    return updatedOptions;
  });
};
  // Fetch products from API
  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/view-products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.Products);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:8000/view-categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.Categories);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [token]);

  // Filter products based on search input
  const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(event.target.value);
  };

  const dataFiltered = applyFilter({
    inputData: products,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  // Open/Close Add Product Dialog (only for admin)
  const handleOpenAddProduct = () => {
    if (user && user.role === 'admin') {
      setOpenAddProduct(true);
    } else {
      alert("You do not have permission to add a product.");
    }
  };
  const handleCloseAddProduct = () => setOpenAddProduct(false);

  // Handle input change for Add Product form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleOpenAddCategory = () => {
    if (user && user.role === 'admin') {
      setOpenAddCategory(true);
    } else {
      alert("You do not have permission to add a category.");
    }
  };
  const handleCloseAddCategory = () => setOpenAddCategory(false);

  const handleInputChangeCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  const handleParentCategoryChange = (event: SelectChangeEvent<number>) => {
    setNewCategory({ ...newCategory, parentID: event.target.value as number });
  };

  // Handle category selection change
  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedCategories(event.target.value as number[]);
  };

  // Submit new product (only admin can add)
  const handleAddProduct = async () => {
  if (!user || user.role !== "admin") {
    alert("You do not have permission to add products.");
    return;
  }

  // Create FormData
  const formData = new FormData();
  formData.append("name", newProduct.name);
  formData.append("description", newProduct.description);
  formData.append("SKU", newProduct.SKU);
  formData.append("price", newProduct.price);
  formData.append("quantity", newProduct.quantity);

  if (selectedImage) {
    formData.append("image", selectedImage);
  }

  // Convert product variations to JSON and append as a string
  const optionsData = productOptions.map((option) => ({
    title: option.title,
    type: option.type,
    required: option.required, // Assuming a 'required' field exists
    values: option.values.map((value) => ({
      title: value.title,
      price: value.price,
      sku: value.sku,
      quantity: value.quantity,
    })),
  }));

  formData.append("options", JSON.stringify(optionsData)); // Add options data

  console.log("FormData:", formData);

  try {
    // Step 1: Add Product
    const response = await axios.post(
      "http://localhost:8000/add-product",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const productID = response.data.productID;

    // Step 2: Assign Categories to the Product
    await axios.post(
      "http://localhost:8000/assign-category",
      { productID, categoryIDs: selectedCategories },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchProducts(); // Refresh product list
    handleCloseAddProduct();
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Failed to add product.");
  }
};


  const handleAddCategory = async () => {
    if (!user || user.role !== 'admin') {
      alert("You do not have permission to add categories.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/add-category",
        newCategory,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleCloseAddCategory();
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Failed to add category");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
  
    try {
      await axios.delete("http://localhost:8000/delete-products", {
        data: { product_ids: selectedProducts }, // Send selected product IDs
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setSelectedProducts([]); // Clear selection
      fetchProducts(); // Refresh product list
    } catch (err) {
      console.error("Failed to delete products:", err);
      alert("Failed to delete products.");
    }
  };

  const handleSelectAllRows = (checked: boolean) => {
    if (checked) {
      const newSelecteds = products.map((product) => product.productID);
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
          Products
        </Typography>
        
        {/* Show "New Product" button only if the user is an admin */}
        {user && user.role === 'admin' && (
          <>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAddProduct}
            >
              New Product
            </Button>
            <Box ml={2}>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenAddCategory}
              >
                Add Categories
              </Button>
            </Box>
          </>
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
                  rowCount={products.length}
                  numSelected={selectedProducts.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => handleSelectAllRows(checked)}
                  headLabel={[
                    { id: 'ProductID', label: 'ID' },
                    { id: 'name', label: 'Name' },
                    { id: 'description', label: 'Description' },
                    { id: 'SKU', label: 'SKU' },
                    { id: 'price', label: 'Price' },
                    { id: 'quantity', label: 'Quantity' },
                    { id: 'categories', label: 'Categories' },
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
                        key={row.productID}
                        row={row}
                        selected={selectedProducts.includes(row.productID)}
                        onSelectRow={() => handleSelectRow(row.productID)}
                        onUserUpdated={fetchProducts} 
                      />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            component="div"
            page={table.page}
            count={products.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}
{/* Add Product Dialog */}
{/* Add Product Dialog */}
<Dialog open={openAddProduct} onClose={handleCloseAddProduct} maxWidth="md" fullWidth>
  <DialogTitle>Add New Product</DialogTitle>
  <DialogContent>
    <Grid container spacing={2}>
      {/* Product Details */}
      <Grid item xs={6}>
        <TextField fullWidth label="Name" name="name" onChange={handleInputChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField fullWidth label="Description" name="description" onChange={handleInputChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField fullWidth label="SKU" name="SKU" onChange={handleInputChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField fullWidth label="Price" name="price" type="number" onChange={handleInputChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField fullWidth label="Quantity" name="quantity" type="number" onChange={handleInputChange} />
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
          onChange={(e) => {
            if (e.target.files) {
              setSelectedImage(e.target.files[0]);
            }
          }}
        />
        {selectedImage && (
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Preview"
            style={{ width: "100%", maxHeight: "200px", marginTop: "10px", objectFit: "contain" }}
          />
        )}
      </Grid>
    </Grid>

    {/* Product Variations Section */}
    <Divider sx={{ marginY: 2 }} />
    <Typography variant="h6" gutterBottom>
      Product Variations
    </Typography>
    <Paper elevation={3} sx={{ padding: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Option Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Values</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productOptions.map((option, optionIndex) => (
              <TableRow key={optionIndex}>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    label="Option Title"
                    value={option.title}
                    onChange={(e) => handleOptionChange(optionIndex, "title", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={option.type}
                    onChange={(e) => handleOptionChange(optionIndex, "type", e.target.value)}
                  >
                    <MenuItem value="dropdown">Dropdown</MenuItem>
                    <MenuItem value="radio">Radio Button</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  {option.values.map((value, valueIndex) => (
                    <div key={valueIndex} style={{ marginBottom: "5px" }}>
                      <TextField
                        size="small"
                        label="Title"
                        value={value.title}
                        onChange={(e) =>
                          handleValueChange(optionIndex, valueIndex, "title", e.target.value)
                        }
                        sx={{ marginRight: 1, width: "25%" }}
                      />
                      <TextField
                        size="small"
                        label="Price"
                        type="number"
                        value={value.price}
                        onChange={(e) =>
                          handleValueChange(optionIndex, valueIndex, "price", e.target.value)
                        }
                        sx={{ marginRight: 1, width: "20%" }}
                      />
                      <TextField
                        size="small"
                        label="SKU"
                        value={value.sku}
                        onChange={(e) =>
                          handleValueChange(optionIndex, valueIndex, "sku", e.target.value)
                        }
                        sx={{ marginRight: 1, width: "20%" }}
                      />
                      <TextField
                        size="small"
                        label="Quantity"
                        type="number"
                        value={value.quantity}
                        onChange={(e) =>
                          handleValueChange(optionIndex, valueIndex, "quantity", e.target.value)
                        }
                        sx={{ width: "20%" }}
                      />
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => addValue(optionIndex)}
                  >
                    Add Value
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button onClick={addOption} variant="contained" sx={{ marginTop: "10px" }}>
        Add New Option
      </Button>
    </Paper>
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCloseAddProduct} color="error">
      Cancel
    </Button>
    <Button onClick={handleAddProduct} variant="contained">
      Add Product
    </Button>
  </DialogActions>
</Dialog>



      {/* Add Category Dialog */}
      <Dialog open={openAddCategory} onClose={handleCloseAddCategory}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" name="name" onChange={handleInputChangeCategory} />
          <TextField fullWidth margin="normal" label="Description" name="description" onChange={handleInputChangeCategory} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Parent Category</InputLabel>
            <Select
              value={newCategory.parentID ?? ""}
              onChange={handleParentCategoryChange}
              renderValue={(selected) => categories.find((cat) => cat.categoryID === selected)?.name || ''}
            >
              {categories.map((category) => (
                <MenuItem key={category.categoryID} value={category.categoryID}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddCategory} color="error">
            Cancel
          </Button>
          <Button onClick={handleAddCategory} variant="contained">
            Add Category
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
