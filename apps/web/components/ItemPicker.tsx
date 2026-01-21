"use client";

import { useState, useEffect } from "react";

interface Item {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  basePrice: string;
  iconUrl: string | null;
  imageUrl: string | null;
  isPopular: boolean;
  sortOrder: number;
}

interface SelectedItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface ItemPickerProps {
  onItemsChange: (items: SelectedItem[]) => void;
}

export default function ItemPicker({ onItemsChange }: ItemPickerProps) {
  const [categories, setCategories] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Item | null>(null);
  const [categoryItems, setCategoryItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<number, SelectedItem>>(
    new Map()
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Load main categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Notify parent when selected items change
  useEffect(() => {
    onItemsChange(Array.from(selectedItems.values()));
  }, [selectedItems, onItemsChange]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch("/api/items?parentId=null");
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.items);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadCategoryItems = async (categoryId: number) => {
    setIsLoadingItems(true);
    try {
      const response = await fetch(`/api/items?parentId=${categoryId}`);
      const data = await response.json();
      
      if (data.success) {
        setCategoryItems(data.items);
      }
    } catch (error) {
      console.error("Error loading category items:", error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCategoryClick = (category: Item) => {
    setSelectedCategory(category);
    loadCategoryItems(category.id);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryItems([]);
  };

  const handleItemClick = (item: Item) => {
    const newSelectedItems = new Map(selectedItems);
    
    if (newSelectedItems.has(item.id)) {
      // Item already selected - increment quantity
      const existing = newSelectedItems.get(item.id)!;
      newSelectedItems.set(item.id, {
        ...existing,
        quantity: existing.quantity + 1,
      });
    } else {
      // New item - add with quantity 1
      newSelectedItems.set(item.id, {
        id: item.id,
        name: item.name,
        quantity: 1,
        price: parseFloat(item.basePrice),
      });
    }
    
    setSelectedItems(newSelectedItems);
  };

  const handleQuantityChange = (itemId: number, change: number) => {
    const newSelectedItems = new Map(selectedItems);
    const item = newSelectedItems.get(itemId);
    
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      // Remove item
      newSelectedItems.delete(itemId);
    } else {
      // Update quantity
      newSelectedItems.set(itemId, {
        ...item,
        quantity: newQuantity,
      });
    }
    
    setSelectedItems(newSelectedItems);
  };

  const getItemQuantity = (itemId: number): number => {
    return selectedItems.get(itemId)?.quantity || 0;
  };

  if (isLoadingCategories) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      {selectedCategory && (
        <div className="mb-4">
          <button
            onClick={handleBackToCategories}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Categories
          </button>
          <h2 className="text-2xl font-bold mt-2">{selectedCategory.name}</h2>
          {selectedCategory.description && (
            <p className="text-gray-600 mt-1">{selectedCategory.description}</p>
          )}
        </div>
      )}

      {/* Main Categories Grid */}
      {!selectedCategory && (
        <>
          <h2 className="text-2xl font-bold mb-4">Select Items to Remove</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
              >
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-3 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <span className="font-medium text-center">{category.name}</span>
                {category.isPopular && (
                  <span className="text-xs text-orange-600 mt-1">Popular</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Category Items Grid */}
      {selectedCategory && (
        <>
          {isLoadingItems ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => {
                const quantity = getItemQuantity(item.id);
                const isSelected = quantity > 0;

                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.isPopular && (
                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold text-orange-600">
                        ${parseFloat(item.basePrice).toFixed(2)}
                      </span>

                      {!isSelected ? (
                        <button
                          onClick={() => handleItemClick(item)}
                          className="px-4 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600"
                        >
                          Add Item
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center border-2 border-orange-500 text-orange-500 rounded-md hover:bg-orange-50"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-md hover:bg-orange-600"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Selected Items Summary (Mobile) */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-lg">
                {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""} selected
              </span>
              <p className="text-sm text-gray-600">
                Total: $
                {Array.from(selectedItems.values())
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}
              </p>
            </div>
            <button className="px-6 py-2 bg-orange-500 text-white font-bold rounded-md">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
