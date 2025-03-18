import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { Product } from '../types';
import { Star, ShoppingCart, Heart, Share2, ChevronLeft } from 'lucide-react';
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

  useEffect(() => {
    const fetchProduct = async () => {
      
      if (!productID) return;
      console.log('Fetching product:', productID);
      setLoading(true);
      try {
        console.log('Fetching product:', productID);
        const data = await productsAPI.getProductById(Number(productID));
        setProduct(data.Product);
        console.log(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productID]);

  // const handleAddToCart = () => {
  //   if (product) {
  //     addToCart(product, quantity);
  //   }
  // };

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

      try {
        await cartAPI.addProductToCart(user.customerid, product.productID, quantity, product.price);
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

  // Mock multiple images for the product
  const productImages = [
    `http://localhost:8000${product.image_path}?t=${new Date().getTime()}`,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  ];
  
  console.log("%%%%%%%%%",product.name);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${activeImage === index ? 'border-indigo-600' : 'border-transparent'}`}
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
                {/* <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({product.reviews.length} reviews)</span>
                </div> */}
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* <div className="mb-6">
              <span className="text-3xl font-bold text-indigo-600">${product.price.toFixed(2)}</span>
              {!product.inStock && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              )}
            </div> */}
            
            {/* <div className="mb-6">
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{product.category}</span>
            </div> */}
            
            <div className="mb-6">
              {/* Quantity Selection */}
                  <div className="flex items-center mb-4">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mr-4">
                        Quantity
                     </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                     >
                       -
                    </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.quantity} // ✅ Restrict max quantity
                    value={quantity}
                    onChange={(e) => {
                   const newQuantity = Math.min(product.quantity, Math.max(1, parseInt(e.target.value) || 1));
                  setQuantity(newQuantity);
                  }}
                 className="w-12 text-center border-0 focus:ring-0"
                />
                 <button 
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                 >
                 +
               </button>
              </div>
             </div>
             {product.quantity < 5 && product.quantity >0 && (
          <p className="px-6 py-4 text-yellow-700 bg-yellow-100 text-center">
            only {product.quantity} items left in Stock
          </p>
        )}

             {product.quantity ===0 && (
          <p className="px-6 py-4 text-yellow-700 bg-yellow-100 text-center">
            Item is currently out of stock
          </p>
        )}

              
              <button
                onClick={handleAddToCart}
                disabled={!product.quantity}
                className={`w-full py-3 px-8 rounded-md font-medium text-white ${
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
              Reviews ({product.description})
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'description' ? (
              <div>
                <p className="text-gray-700">{product.description}</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>High-quality materials</li>
                      <li>Durable construction</li>
                      <li>Modern design</li>
                      <li>Easy to use</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Brand</span>
                        <span className="font-medium text-gray-900">ShopEase</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Material</span>
                        <span className="font-medium text-gray-900">Premium</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-medium text-gray-900">0.5 kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensions</span>
                        <span className="font-medium text-gray-900">10 x 5 x 2 cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* {product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{review.username}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                )} */}
                
                {/* Review Form */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="text-gray-300 hover:text-yellow-400"
                          >
                            <Star className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                        Review
                      </label>
                      <textarea
                        id="comment"
                        rows={4}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Share your experience with this product"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;