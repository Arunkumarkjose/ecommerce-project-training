import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { cartAPI } from '../api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to add products to your cart.');
      return;
    }

    try {
      await cartAPI.addProductToCart(user.customerid, product.productID, 1, product.price);
      alert('Product added to cart successfully.');
      addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      alert('Failed to add product to cart.');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden group relative">
      <Link to={`/products/${product.productID}`}>
        {/* Product Image */}
        <div className="relative w-full h-60 w-50 aspect-square overflow-hidden bg-gray-100">
          <img 
            src={`http://localhost:8000${product.image_path}?t=${new Date().getTime()}`}
            alt={product.name} 
            className=" object-cover group-hover:scale-105 transition-transform duration-300"
          />
      
          {!product.quantity && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 text-xs">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-rm text-black-500 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">${product.price.toFixed(2)}</span>
              
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={!product.quantity}
              className={`p-2 rounded-full ${
                product.quantity 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
