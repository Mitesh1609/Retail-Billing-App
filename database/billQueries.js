import { getDatabase } from './db';

// Save a new bill with its items
export const saveBill = async (billData, items) => {
  const db = await getDatabase();

  // Generate bill number
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const billNumber = `${yy}-${mm}-${dd}/${hh}:${min}`;

  // Insert bill
  const result = await db.runAsync(
    `INSERT INTO bills (bill_number, customer_name, total_amount, discount, final_amount, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      billNumber,
      billData.customerName,
      billData.totalAmount,
      billData.discount,
      billData.finalAmount,
      billData.paymentMethod,
    ]
  );

  const billId = result.lastInsertRowId;

  // Insert each item
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO bill_items (bill_id, product_name, price, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [billId, item.name, item.price, item.quantity, item.subtotal]
    );
  }

  return billNumber;
};

// Get all bills
export const getAllBills = async () => {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM bills ORDER BY created_at DESC');
};

// Get items of a specific bill
export const getBillItems = async (billId) => {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);
};

// Get today's sales summary
export const getTodaySummary = async () => {
  const db = await getDatabase();
  const result = await db.getFirstAsync(`
    SELECT
      COUNT(*) as totalBills,
      SUM(final_amount) as totalSales
    FROM bills
    WHERE date(created_at) = date('now')
  `);
  return result;
};

// Get monthly sales summary
export const getMonthlySummary = async () => {
  const db = await getDatabase();
  const result = await db.getFirstAsync(`
    SELECT
      COUNT(*) as totalBills,
      SUM(final_amount) as totalSales
    FROM bills
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `);
  return result;
};