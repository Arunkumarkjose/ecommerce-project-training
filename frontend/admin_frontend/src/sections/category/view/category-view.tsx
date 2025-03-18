import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Avatar } from "@mui/material";
import { useAuth } from 'src/contexts/AuthContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  FormGroup,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from "@mui/material";

interface Category {
  categoryID: number;
  name: string;
  description: string;
  parentID?: number | null;
  children: Category[];
}

interface Product {
  productID: number;
  name: string;
  description: string;
  price: number;
  SKU: string;
  quantity: number;
  image_path?: string; 
}

interface TreeNodeProps {
  node: Category;
  level: number;
  onSelect: (category: Category) => void;
  selectedCategoryID: number | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onSelect, selectedCategoryID }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const isSelected = selectedCategoryID === node.categoryID;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer ${
          isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${level * 20 + 4}px` }}
      >
        <span className="mr-1.5">
          {hasChildren ? (
            isOpen ? (
              <FolderOpen size={18} className="text-amber-500" />
            ) : (
              <Folder size={18} className="text-amber-500" />
            )
          ) : (
            <FileText size={18} className="text-gray-500" />
          )}
        </span>
        
        <span className="text-sm font-medium text-gray-800 flex-grow">
          {node.name}
        </span>
        
        {hasChildren && (
          <span className="ml-1.5 text-xs text-gray-500 mr-1">
            ({node.children.length})
          </span>
        )}
        
        {hasChildren && (
          <span className="text-gray-500" onClick={toggleOpen}>
            {isOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
        )}
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode 
              key={child.categoryID} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect} 
              selectedCategoryID={selectedCategoryID} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreeView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [initiallyAssignedProducts, setInitiallyAssignedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchCategories();
    fetchAllProducts();
  }, [token]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/view-categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const categoryData = response.data.Categories || response.data;
      const categoryTree = buildCategoryTree(categoryData);
      setCategories(categoryTree);
      setAllCategories(categoryData);
      setError(null);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/view-products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllProducts(response.data.Products);
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  const fetchProductsForCategory = async (categoryID: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/view-products?category_id=${categoryID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.Products;
    } catch (error) {
      console.error("Error fetching products for category:", error);
      return [];
    }
  };

  const handleAssignProducts = async () => {
    if (!selectedCategory) return;

    const newlySelectedProducts = selectedProducts.filter(
      (productID) => !initiallyAssignedProducts.includes(productID)
    );

    const productsToRemove = initiallyAssignedProducts.filter(
      (productID) => !selectedProducts.includes(productID)
    );

    try {
      if (newlySelectedProducts.length > 0) {
        await axios.post(
          "http://localhost:8000/assign-mul-prod-category",
          { productIDs: newlySelectedProducts, categoryID: selectedCategory.categoryID },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      for (const productID of productsToRemove) {
        await axios.delete("http://localhost:8000/delete-cat-prod", {
          data: { productID, categoryID: selectedCategory.categoryID },
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Refresh products for the selected category
      const updatedProducts = await fetchProductsForCategory(selectedCategory.categoryID);
      setProducts(updatedProducts);
      const updatedProductIDs = updatedProducts.map((product: Product) => product.productID);
      setSelectedProducts(updatedProductIDs);
      setInitiallyAssignedProducts(updatedProductIDs);
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Error updating product assignments:", error);
    }
  };

  const handleProductChange = (productID: number) => {
    if (selectedProducts.includes(productID)) {
      // Uncheck: Remove product from selectedProducts
      setSelectedProducts((prevSelected) => prevSelected.filter((id) => id !== productID));
    } else {
      // Check: Add product to selectedProducts
      setSelectedProducts((prevSelected) => [...prevSelected, productID]);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    const productsForCategory = await fetchProductsForCategory(category.categoryID);
    const productIDs = productsForCategory.map((product: Product) => product.productID);
    setSelectedProducts(productIDs);
    setInitiallyAssignedProducts(productIDs); // Track initially assigned products
    setProducts(productsForCategory); // Set the products for the selected category
    setSelectedProduct(null); // Clear selected product when changing categories
  };

  // Product menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Edit product handlers
  const handleOpenEditDialog = () => {
    if (selectedProduct) {
      setEditedProduct({...selectedProduct});
      
      // Get currently assigned categories for this product
      const getProductCategories = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/get-product-categories/${selectedProduct.productID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelectedCategories(response.data.assignedCategories || []);
        } catch (error) {
          console.error("Error fetching product categories:", error);
          setSelectedCategories([]);
        }
      };
      
      getProductCategories();
      setOpenEditDialog(true);
      handleCloseMenu();
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Delete product handlers
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedProduct) {
      setEditedProduct({ 
        ...editedProduct, 
        [e.target.name]: e.target.name === 'price' || e.target.name === 'quantity' 
          ? Number(e.target.value) 
          : e.target.value 
      });
    }
  };

  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedCategories(event.target.value as number[]);
  };

  // Update product API call
  const handleSaveEdit = async () => {
    if (!editedProduct) return;
    
    try {
      const updatedData = { 
        name: editedProduct.name, 
        description: editedProduct.description, 
        SKU: editedProduct.SKU,
        price: editedProduct.price,
        quantity: editedProduct.quantity,
        category_ids: selectedCategories
      };

      await axios.put(
        `http://localhost:8000/update-product/${editedProduct.productID}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Refresh products for the selected category
      if (selectedCategory) {
        const updatedProducts = await fetchProductsForCategory(selectedCategory.categoryID);
        setProducts(updatedProducts);
      }
      
      // Update the selected product with new data
      setSelectedProduct(editedProduct);
      
      handleCloseEditDialog();
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
    }
  };

  // Delete product API call
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await axios.delete(`http://localhost:8000/delete-products`, {
        data: { product_ids: [selectedProduct.productID] },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh products for the selected category
      if (selectedCategory) {
        const updatedProducts = await fetchProductsForCategory(selectedCategory.categoryID);
        setProducts(updatedProducts);
      }
      
      setSelectedProduct(null);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  // Convert adjacency list to a tree structure
  const buildCategoryTree = (categories: any[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    
    // First pass: create all category objects with empty children arrays
    categories.forEach((cat) => {
      categoryMap.set(cat.categoryID, { 
        ...cat, 
        children: [] 
      });
    });

    // Second pass: build the tree structure
    const tree: Category[] = [];
    categories.forEach((cat) => {
      const currentCategory = categoryMap.get(cat.categoryID);
      
      if (!currentCategory) return;
      
      if (cat.parentID) {
        const parentCategory = categoryMap.get(cat.parentID);
        if (parentCategory) {
          parentCategory.children.push(currentCategory);
        } else {
          // If parent doesn't exist, add to root
          tree.push(currentCategory);
        }
      } else {
        // No parent, so it's a root category
        tree.push(currentCategory);
      }
    });

    return tree;
  };

  const filteredProducts = searchTerm 
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allProducts;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress color="primary" size={40} thickness={4} />
        <Typography variant="body1" color="text.secondary" ml={2}>
          Loading categories...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          maxWidth: "800px", 
          mx: "auto", 
          mt: 4,
          borderRadius: 2,
          boxShadow: 2
        }}
      >
        {error}
      </Alert>
    );
  }

  if (categories.length === 0) {
    return (
      <Alert 
        severity="warning" 
        sx={{ 
          maxWidth: "800px", 
          mx: "auto", 
          mt: 4,
          borderRadius: 2,
          boxShadow: 2
        }}
      >
        No categories found. Please add categories to get started.
      </Alert>
    );
  }

  return (
    <Box 
      sx={{ 
        maxWidth: "1200px", 
        mx: "auto", 
        mt: 4, 
        px: 2,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)"
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%)',
          border: '1px solid #e2e8f0'
        }}
      >
        <Typography variant="h4" fontWeight={600} color="#2d3748" gutterBottom>
          Category Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse categories and manage product assignments
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
        {/* Category Tree Panel */}
        <Paper 
          elevation={2} 
          sx={{ 
            width: "40%", 
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
            <Typography variant="h6" fontWeight={600} color="#334155">
              Category Hierarchy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {categories.length} root {categories.length === 1 ? 'category' : 'categories'}
            </Typography>
          </Box>
          
          <Box sx={{ p: 0, overflowY: "auto", flexGrow: 1, bgcolor: "#fff" }}>
            {categories.map((category) => (
              <TreeNode 
                key={category.categoryID} 
                node={category} 
                level={0} 
                onSelect={handleCategorySelect} 
                selectedCategoryID={selectedCategory?.categoryID || null} 
              />
            ))}
          </Box>
        </Paper>

        {/* Category Details Panel */}
        <Paper 
          elevation={2} 
          sx={{ 
            width: "60%", 
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {selectedCategory ? (
            <>
              <Box sx={{ p: 3, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                <Typography variant="h6" fontWeight={600} color="#334155">
                  {selectedCategory.name}
                </Typography>
                {selectedCategory.description && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {selectedCategory.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                  <Chip 
                    label={`${products.length} Products`} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => setOpenDialog(true)}
                    sx={{ 
                      textTransform: "none", 
                      borderRadius: 1.5,
                      boxShadow: 2
                    }}
                  >
                    Manage Products
                  </Button>
                </Box>
              </Box>

              <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} color="#334155" mb={2}>
                  Assigned Products
                </Typography>
                
                {products.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 1 }}>
                    No products assigned to this category yet.
                  </Alert>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {products.map(product => (
                      <Box 
                        key={product.productID}
                        sx={{ 
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          mr: 1,
                          mb: 1,
                          gap: 1
                        }}
                      >
                        <Avatar
      src={`http://localhost:8000${product.image_path}?t=${new Date().getTime()}`}
      alt={product.name}
      sx={{ width: 50, height: 50 }}
    />
                        <Chip 
                          label={product.name}
                          variant="outlined"
                          onClick={() => handleProductClick(product)}
                          sx={{ 
                            borderRadius: 1,
                            pr: 4,
                            '&:hover': { bgcolor: '#f0f9ff' }
                          }}
                        />
                        <IconButton 
                          size="small"
                          onClick={(e) => handleOpenMenu(e, product)}
                          sx={{ 
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            p: 0.5
                          }}
                        >
                          <MoreVertical size={14} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {selectedProduct && (
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      mt: 4, 
                      p: 3, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600} color="#334155">
                        Product Details
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={handleOpenEditDialog}
                          sx={{ mr: 1 }}
                        >
                          <Edit size={18} />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={handleOpenDeleteDialog}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedProduct.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          SKU
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.SKU}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1">
                          ${selectedProduct.price.toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.quantity}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="caption" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {selectedProduct.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Box>
            </>
          ) : (
            <Box 
              sx={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",
                p: 4,
                height: "100%",
                bgcolor: "#f8fafc"
              }}
            >
              <Folder size={48} color="#94a3b8" />
              <Typography variant="h6" color="#64748b" mt={2}>
                Select a category
              </Typography>
              <Typography variant="body2" color="#94a3b8" textAlign="center" mt={1}>
                Choose a category from the tree view to see its details and manage assigned products
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Product Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { 
            minWidth: 120,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 1.5
          }
        }}
      >
        <MenuItem onClick={handleOpenEditDialog} sx={{ py: 1, px: 2 }}>
          <Edit size={16} className="mr-2" />
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ py: 1, px: 2, color: 'error.main' }}>
          <Trash2 size={16} className="mr-2" />
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Product Assignment Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6">
            Manage Products for {selectedCategory?.name}
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <TextField
            fullWidth
            placeholder="Search products..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton edge="start" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
            <FormGroup>
              {filteredProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No products found matching your search
                </Typography>
              ) : (
                filteredProducts.map((product) => (
                  <FormControlLabel
                    key={product.productID}
                    control={
                      <Checkbox
                        checked={selectedProducts.includes(product.productID)}
                        onChange={() => handleProductChange(product.productID)}
                        color="primary"
                      />
                    }
                    label={product.name}
                    sx={{ 
                      py: 0.5, 
                      px: 1, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#f0f9ff' }
                    }}
                  />
                ))
              )}
            </FormGroup>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignProducts} 
            variant="contained" 
            color="primary"
            sx={{ textTransform: "none" }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6">
            Edit Product
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          {editedProduct && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Name"
                name="name"
                value={editedProduct.name}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                name="description"
                multiline
                rows={3}
                value={editedProduct.description}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="SKU"
                name="SKU"
                value={editedProduct.SKU}
                onChange={handleInputChange}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={editedProduct.price}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={editedProduct.quantity}
                  onChange={handleInputChange}
                />
              </Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  renderValue={(selected) => 
                    selected
                      .map(id => allCategories.find(cat => cat.categoryID === id)?.name)
                      .filter(Boolean)
                      .join(', ')
                  }
                >
                  {allCategories.map((category) => (
                    <MenuItem key={category.categoryID} value={category.categoryID}>
                      <Checkbox checked={selectedCategories.includes(category.categoryID)} />
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseEditDialog} 
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            sx={{ textTransform: "none" }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Confirm Deletion
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProduct} 
            variant="contained" 
            color="error"
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};