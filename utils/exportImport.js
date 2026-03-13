import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getAllProducts } from "../database/productQueries";
import { getAllCustomers } from "../database/customerQueries";
import { getAllBills, getBillItems } from "../database/billQueries";
import { getDatabase } from "../database/db";

// ─── EXPORT ───────────────────────────────────────────

export const exportData = async () => {
  try {
    // Fetch all data
    const products = await getAllProducts();
    const customers = await getAllCustomers();
    const bills = await getAllBills();

    // Fetch bill items for each bill
    const billItems = [];
    for (const bill of bills) {
      const items = await getBillItems(bill.id);
      billItems.push(...items.map((item) => ({ ...item, bill_id: bill.id })));
    }

    // Build export object
    const exportObj = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      shop: "RetailBillingApp",
      counts: {
        products: products.length,
        customers: customers.length,
        bills: bills.length,
        billItems: billItems.length,
      },
      products,
      customers,
      bills,
      billItems,
    };

    // Generate filename with date
    const now = new Date();
    const dateStr = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const fileName = `retail-backup-${dateStr}.json`;
    const filePath = FileSystem.documentDirectory + fileName;

    // Write to app directory first
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportObj, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 },
    );

    // Save to Downloads folder
    const downloadPath = FileSystem.StorageAccessFramework;
    const permissions = await downloadPath.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const destinationUri = await downloadPath.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/json",
      );
      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await FileSystem.writeAsStringAsync(destinationUri, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Also share file
    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Save or Share Backup",
    });

    return { success: true, counts: exportObj.counts };
  } catch (error) {
    console.error("Export error:", error);
    return { success: false, error: error.message };
  }
};

// ─── IMPORT ───────────────────────────────────────────

export const importData = async (mode) => {
  // mode = 'replace' or 'merge'
  try {
    // Pick JSON file
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { success: false, canceled: true };

    // Read file
    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri,
      { encoding: "utf8" },
    );

    // Parse JSON
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch {
      return {
        success: false,
        error: "Invalid file format. Please select a valid backup file.",
      };
    }

    // Validate structure
    if (!data.products || !data.customers || !data.bills || !data.billItems) {
      return {
        success: false,
        error: "Invalid backup file. Missing required data.",
      };
    }

    const db = await getDatabase();

    if (mode === "replace") {
      await replaceImport(db, data);
    } else {
      await mergeImport(db, data);
    }

    return {
      success: true,
      counts: {
        products: data.products.length,
        customers: data.customers.length,
        bills: data.bills.length,
      },
    };
  } catch (error) {
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }
};

// ─── REPLACE MODE ─────────────────────────────────────

const replaceImport = async (db, data) => {
  // Delete all existing data
  await db.runAsync("DELETE FROM bill_items");
  await db.runAsync("DELETE FROM bills");
  await db.runAsync("DELETE FROM customers");
  await db.runAsync("DELETE FROM products");

  // Reset auto increment
  await db.runAsync(
    "DELETE FROM sqlite_sequence WHERE name IN ('products', 'customers', 'bills', 'bill_items')",
  );

  // Insert new data
  await insertData(db, data);
};

// ─── MERGE MODE ───────────────────────────────────────

const mergeImport = async (db, data) => {
  // Products — merge by name (skip duplicates)
  const existingProducts = await db.getAllAsync("SELECT name FROM products");
  const existingProductNames = new Set(
    existingProducts.map((p) => p.name.toLowerCase()),
  );

  for (const product of data.products) {
    if (!existingProductNames.has(product.name.toLowerCase())) {
      await db.runAsync(
        "INSERT INTO products (name, price, category, unit) VALUES (?, ?, ?, ?)",
        [product.name, product.price, product.category, product.unit],
      );
    }
  }

  // Customers — merge by phone (skip duplicates)
  const existingCustomers = await db.getAllAsync("SELECT phone FROM customers");
  const existingPhones = new Set(existingCustomers.map((c) => c.phone));

  for (const customer of data.customers) {
    if (!customer.phone || !existingPhones.has(customer.phone)) {
      await db.runAsync(
        "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
        [customer.name, customer.phone, customer.address],
      );
    }
  }

  // Bills — merge by bill_number (skip duplicates)
  const existingBills = await db.getAllAsync("SELECT bill_number FROM bills");
  const existingBillNumbers = new Set(existingBills.map((b) => b.bill_number));

  for (const bill of data.bills) {
    if (!existingBillNumbers.has(bill.bill_number)) {
      const result = await db.runAsync(
        `INSERT INTO bills (bill_number, customer_name, total_amount, discount, final_amount, payment_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bill.bill_number,
          bill.customer_name,
          bill.total_amount,
          bill.discount,
          bill.final_amount,
          bill.payment_method,
          bill.created_at,
        ],
      );

      // Insert bill items with new bill id
      const newBillId = result.lastInsertRowId;
      const items = data.billItems.filter((i) => i.bill_id === bill.id);
      for (const item of items) {
        await db.runAsync(
          "INSERT INTO bill_items (bill_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?)",
          [
            newBillId,
            item.product_name,
            item.price,
            item.quantity,
            item.subtotal,
          ],
        );
      }
    }
  }
};

// ─── INSERT HELPER ────────────────────────────────────

const insertData = async (db, data) => {
  // Build old id → new id map for bills
  const billIdMap = {};

  // Insert products
  for (const product of data.products) {
    await db.runAsync(
      "INSERT INTO products (name, price, category, unit) VALUES (?, ?, ?, ?)",
      [product.name, product.price, product.category, product.unit],
    );
  }

  // Insert customers
  for (const customer of data.customers) {
    await db.runAsync(
      "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
      [customer.name, customer.phone, customer.address],
    );
  }

  // Insert bills and track new ids
  for (const bill of data.bills) {
    const result = await db.runAsync(
      `INSERT INTO bills (bill_number, customer_name, total_amount, discount, final_amount, payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bill.bill_number,
        bill.customer_name,
        bill.total_amount,
        bill.discount,
        bill.final_amount,
        bill.payment_method,
        bill.created_at,
      ],
    );
    billIdMap[bill.id] = result.lastInsertRowId;
  }

  // Insert bill items using mapped bill ids
  for (const item of data.billItems) {
    const newBillId = billIdMap[item.bill_id];
    if (newBillId) {
      await db.runAsync(
        "INSERT INTO bill_items (bill_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?)",
        [
          newBillId,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal,
        ],
      );
    }
  }
};
