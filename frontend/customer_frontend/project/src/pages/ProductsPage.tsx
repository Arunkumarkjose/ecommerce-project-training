import React, { useState, useEffect } from 'react';
import {  useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { Product, Filter } from '../types';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryIDFromURL = searchParams.get("category_id");
 
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({
    category_id: categoryIDFromURL ? Number(categoryIDFromURL) : null,    
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
    sortBy: (searchParams.get('sort') as Filter['sortBy']) || 'newest',
  });
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {};
  
        // ✅ Always take category from URL first, then from filter
        if (searchParams.get("category_id")) {
          params.category_id = Number(searchParams.get("category_id"));
        } else if (filter.category_id) {
          params.category_id = filter.category_id;
        }
  
        if (filter.minPrice !== null) params.minPrice = filter.minPrice;
        if (filter.maxPrice !== null) params.maxPrice = filter.maxPrice;
        if (filter.rating !== null) params.rating = filter.rating;
        if (filter.sortBy) params.sort = filter.sortBy;
  
        console.log("Fetching products with params:", params);
        const data = await productsAPI.getProducts(params);
        setProducts(data.Products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, [searchParams.get("category_id"), filter.minPrice, filter.maxPrice, filter.rating, filter.sortBy]);
  
  

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Products</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <ProductFilter onFilterChange={handleFilterChange} currentFilter={filter} />
        </div>
        
        {/* Product grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.productID} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;