import React, { useState, useEffect } from 'react';
import { Filter } from '../types';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { Sliders, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface ProductFilterProps {
  onFilterChange: (filter: Filter) => void;
  currentFilter: Filter;
}

interface CategoryNode {
  categoryID: number;
  name: string;
  parentID: number | null;
  description: string;
  path: string;
  children: CategoryNode[];
}

const ProductFilter: React.FC<ProductFilterProps> = ({ onFilterChange, currentFilter }) => {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>(currentFilter);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productsAPI.getCategories();
        const categoriesArray = Array.isArray(data.Categories) ? data.Categories : [];
        setCategories(buildCategoryTree(categoriesArray));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const buildCategoryTree = (flatCategories: any[]): CategoryNode[] => {
    const categoryMap = new Map<number, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    flatCategories.forEach(category => {
      categoryMap.set(category.categoryID, { ...category, children: [] });
    });

    flatCategories.forEach(category => {
      const categoryNode = categoryMap.get(category.categoryID)!;
      if (category.parentID === null) {
        rootCategories.push(categoryNode);
      } else {
        const parentNode = categoryMap.get(category.parentID);
        if (parentNode) {
          parentNode.children.push(categoryNode);
        }
      }
    });

    return rootCategories;
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleFilterChange = (key: keyof Filter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);

    // Update URL parameters
    setSearchParams((prev) => {
      const updatedParams = new URLSearchParams(prev);
      if (key === 'category_id') {
        updatedParams.set('category_id', String(value));
      } else if (key === 'minPrice') {
        updatedParams.set('minPrice', value ? String(value) : '');
      } else if (key === 'maxPrice') {
        updatedParams.set('maxPrice', value ? String(value) : '');
      } else if (key === 'rating') {
        updatedParams.set('rating', value ? String(value) : '');
      } else if (key === 'sortBy') {
        updatedParams.set('sort', value);
      }
      return updatedParams;
    });
  };

 

  const resetFilter = () => {
    const resetFilter: Filter = {
      category_id: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      sortBy: 'newest',
    };

    setFilter(resetFilter); // ✅ Reset local state
    onFilterChange(resetFilter); // ✅ Reset parent state
    setSearchParams(''); // ✅ Clear all URL parameters
  };

  const renderCategoryTree = (categories: CategoryNode[], level: number = 0) => {
    return categories.map(category => (
      <div key={category.categoryID} style={{ marginLeft: `${level * 16}px` }}>
        <div className="flex items-center py-2">
          {category.children.length > 0 && (
            <button
              onClick={() => toggleCategory(category.categoryID)}
              className="p-1 hover:bg-gray-100 rounded-md mr-1"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  expandedCategories.has(category.categoryID) ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value={category.categoryID}
              checked={filter.category_id === category.categoryID}
              onChange={(e) => handleFilterChange('category_id', Number(e.target.value))}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">{category.name}</span>
          </label>
        </div>
        {expandedCategories.has(category.categoryID) && category.children.length > 0 && (
          <div className="ml-2 border-l border-gray-200 pl-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <Sliders className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Categories */}
          <div>
            <h4 className="font-medium mb-2">Categories</h4>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
              {renderCategoryTree(categories)}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-2">Price Range</h4>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filter.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filter.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="font-medium mb-2">Minimum Rating</h4>
            <select
              value={filter.rating || ''}
              onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Star</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2 pt-2">
            <button onClick={resetFilter} className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;
