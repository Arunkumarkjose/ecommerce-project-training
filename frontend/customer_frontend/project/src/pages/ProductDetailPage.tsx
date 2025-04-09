import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { Product } from '../types';
import { Star, ShoppingCart, Heart, ChevronLeft } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { cartAPI } from '../api';
import useAuthStore from '../store/authStore';

const ProductDetailPage: React.FC = () => {
  const { productID } = useParams<{ productID: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const [options, setOptions] = useState<any[]>([]); // State for product options
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: any }>({}); // Track selected options

  const handleOptionChange = (optionTitle: string, valueTitle: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionTitle]: valueTitle, // Use option title as key and value title as value
    }));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productID) return;
      setLoading(true);
      try {
        const data = await productsAPI.getProductById(Number(productID));
        setProduct(data.Product);
        setOptions(data.Options); // Set product options
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productID]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (!user) {
      alert('Please log in to add products to your cart.');
      return;
    }
  
    if (!product) {
      alert('Product not found.');
      return;
    }
  
    // Ensure all required options are selected
    for (const option of options) {
      if (option.is_required === "yes" && !selectedOptions[option.title]) {
        alert(`Please select a value for ${option.title}.`);
        return;
      }
    }
  
    try {
      const payload = {
        customerID: user.customerid,
        productID: product.productID,
        quantity,
        price: product.price,
        selected_options: selectedOptions, // Include selected options as JSON
      };
  
      await cartAPI.addProductToCart(payload); // Send payload to the API
      addToCart(product, quantity);
      alert('Product added to cart successfully.');
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      alert('Failed to add product to cart.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Products
        </Link>
      </div>
    );
  }

  const productImages = [
    `http://localhost:8000${product.image_path}?t=${new Date().getTime()}`,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/products" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Products
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Product Images */}
          <div className="md:w-1/2 p-6">
            <div className="relative h-80 mb-4 rounded-lg overflow-hidden">
              <img
                src={productImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex space-x-2">
              {productImages.map((img, index) => (
                <div
                  key={index}
                  className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${
                    activeImage === index ? 'border-indigo-600' : 'border-transparent'
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-lg font-semibold text-indigo-600">${product.price.toFixed(2)}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Product Options */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Options</h3>
              <div className="space-y-6">
                {options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {option.title} {option.is_required === 'yes' && <span className="text-red-500">*</span>}
                    </label>
                    {option.type === 'dropdown' ? (
                      <select
                      className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
                      onChange={(e) => {
                        const selectedValue = option.values.find((value: { id: number; title: string; price: number }) => value.id === Number(e.target.value));
                        handleOptionChange(option.title, selectedValue?.title || '');
                      }}
                    >
                        <option value="">Select {option.title}</option>
                        {option.values.map((value: { id: number; title: string; price: number }) => (
                          <option key={value.id} value={value.id}>
                            {value.title} (+${value.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        {option.values.map((value: { id: number; title: string; price: number }) => (
                          <label
                            key={value.id}
                            className="flex items-center space-x-3 cursor-pointer"
                          >
                            <input
          type="radio"
          name={`option-${option.id}`}
          value={value.id}
          onChange={() => handleOptionChange(option.title, value.title)}
          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
        />
                            <span className="text-sm text-gray-700">
                              {value.title} (+${value.price.toFixed(2)})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = Math.min(product.quantity, Math.max(1, parseInt(e.target.value) || 1));
                    setQuantity(newQuantity);
                  }}
                  className="w-12 text-center border-0 focus:ring-0"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              {product.quantity < 5 && product.quantity > 0 && (
                <p className="mt-2 text-sm text-yellow-700">Only {product.quantity} items left in stock!</p>
              )}
              {product.quantity < 1 && (
                <p className="mt-2 text-sm text-red-700">This item is currently out of stock.</p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.quantity}
              className={`w-full py-3 px-8 rounded-lg font-medium text-white ${
                product.quantity
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="inline-block h-5 w-5 mr-2" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'description'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'description' ? (
              <div>
                <p className="text-gray-700">{product.description}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;