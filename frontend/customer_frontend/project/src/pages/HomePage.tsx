import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // In a real app, you would have specific endpoints for these categories
        const response = await productsAPI.getProducts();
        const products=response.Products;
        // For demo purposes, we'll filter the products here
        setFeaturedProducts(products.slice(0, 4));
        setNewArrivals(products.slice(4, 8));
        setTopRated(products.slice(0, 4).reverse());
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative bg-indigo-700 rounded-xl overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-transparent opacity-90"></div>
        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 lg:py-32 lg:px-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Summer Collection
          </h1>
          <p className="mt-6 max-w-lg text-xl text-indigo-100">
            Discover our latest arrivals and trending products. Shop now and get free shipping on all orders over $100.
          </p>
          <div className="mt-10">
            <Link
              to="/products"
              className="inline-block bg-white py-3 px-8 rounded-md font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.productID} product={product} />
          ))}
        </div>
      </section>

      {/* Categories Banner */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/categories/electronics" className="relative rounded-lg overflow-hidden h-48 group">
            <img 
              src="https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="Electronics" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white text-2xl font-bold">Electronics</h3>
            </div>
          </Link>
          <Link to="/categories/fashion" className="relative rounded-lg overflow-hidden h-48 group">
            <img 
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80" 
              alt="Fashion" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white text-2xl font-bold">Fashion</h3>
            </div>
          </Link>
          <Link to="/categories/home" className="relative rounded-lg overflow-hidden h-48 group">
            <img 
              src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1174&q=80" 
              alt="Home" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white text-2xl font-bold">Home & Living</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          <Link to="/products?sort=newest" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.productID} product={product} />
          ))}
        </div>
      </section>

      {/* Top Rated Products */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Top Rated</h2>
          <Link to="/products?sort=rating" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topRated.map((product) => (
            <ProductCard key={product.productID} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-100 rounded-xl p-8 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscribe to our Newsletter</h2>
          <p className="text-gray-600 mb-6">
            Get the latest updates on new products and upcoming sales.
          </p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow px-4 py-3 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;