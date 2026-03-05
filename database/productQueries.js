import { getDatabase } from './db';

// Get all products
export const getAllProducts = async () => {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
};

// Add a new product
export const addProduct = async (name, price, category, unit) => {
  const db = await getDatabase();
  return await db.runAsync(
    'INSERT INTO products (name, price, category, unit) VALUES (?, ?, ?, ?)',
    [name, price, category, unit]
  );
};

// Update a product
export const updateProduct = async (id, name, price, category, unit) => {
  const db = await getDatabase();
  return await db.runAsync(
    'UPDATE products SET name = ?, price = ?, category = ?, unit = ? WHERE id = ?',
    [name, price, category, unit, id]
  );
};

// Delete a product
export const deleteProduct = async (id) => {
  const db = await getDatabase();
  return await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

// Search products by name
export const searchProducts = async (query) => {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC',
    [`%${query}%`]
  );
};