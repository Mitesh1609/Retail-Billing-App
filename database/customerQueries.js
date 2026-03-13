import { getDatabase } from './db';

// Get all customers
export const getAllCustomers = async () => {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM customers ORDER BY name ASC');
};

// Add a new customer
export const addCustomer = async (name, phone, address) => {
  const db = await getDatabase();
  return await db.runAsync(
    'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
    [name, phone, address]
  );
};

// Update a customer
export const updateCustomer = async (id, name, phone, address) => {
  const db = await getDatabase();
  return await db.runAsync(
    'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone, address, id]
  );
};

// Delete a customer
export const deleteCustomer = async (id) => {
  const db = await getDatabase();
  return await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
};

// Search customers
export const searchCustomers = async (query) => {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ?',
    [`%${query}%`, `%${query}%`]
  );
};

export const checkPhoneExists = async (phone, excludeId = null) => {
  const db = await getDatabase();
  if (excludeId) {
    // When editing, exclude the current customer
    const result = await db.getFirstAsync(
      'SELECT id FROM customers WHERE phone = ? AND id != ?',
      [phone, excludeId]
    );
    return result !== null;
  } else {
    const result = await db.getFirstAsync(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );
    return result !== null;
  }
};