import { NativeModules } from 'react-native';

// Avoid importing the library at module load time because it crashes in
// environments where the native module isn't available (e.g. Expo Go).
const getNativeBluetoothModules = () => {
  const { BluetoothManager, BluetoothEscposPrinter } = NativeModules;
  return { BluetoothManager, BluetoothEscposPrinter };
};

const ensureBluetoothModules = () => {
  let { BluetoothManager, BluetoothEscposPrinter } = getNativeBluetoothModules();

  // FALLBACK: Mock implementation for development/emulators
  if (!BluetoothManager || !BluetoothEscposPrinter) {
    if (__DEV__) {
        console.warn('⚠️ Bluetooth native modules not found. Using MOCK PRINTER for debugging.');
        
        // Mock BluetoothManager
        if (!BluetoothManager) {
            BluetoothManager = {
                checkBluetoothEnabled: async () => true,
                enableBluetooth: async () => true,
                scanDevices: async () => JSON.stringify({ paired: [{ name: 'MOCK_PRINTER_58mm', address: '00:11:22:33:44:55' }] }),
                connect: async (addr) => { console.log(`[MOCK] Connected to printer at ${addr}`); return true; },
            };
        }

        // Mock BluetoothEscposPrinter
        if (!BluetoothEscposPrinter) {
            BluetoothEscposPrinter = {
                ALIGN: { LEFT: 0, CENTER: 1, RIGHT: 2 },
                printerAlign: async (align) => console.log(`[PRINT_ALIGN] ${align === 1 ? 'CENTER' : align === 2 ? 'RIGHT' : 'LEFT'}`),
                printText: async (text) => console.log(`[PRINT_TEXT] ${text.replace('\n', '')}`),
            };
        }
        
        return { BluetoothManager, BluetoothEscposPrinter };
    }

    const error = new Error(
      'Bluetooth printer native modules are not available. Use a dev build or a custom native build.'
    );
    error.code = 'BLUETOOTH_MODULE_MISSING';
    throw error;
  }

  // Ensure ALIGN constants exist (library adds these at import time).
  if (!BluetoothEscposPrinter.ALIGN) {
    BluetoothEscposPrinter.ALIGN = {
      LEFT: 0,
      CENTER: 1,
      RIGHT: 2,
    };
  }

  return { BluetoothManager, BluetoothEscposPrinter };
};

// Scan for paired Bluetooth devices
export const getPairedDevices = async () => {
  try {
    const { BluetoothManager } = ensureBluetoothModules();
    // Check if Bluetooth is enabled
    const enabled = await BluetoothManager.checkBluetoothEnabled();
    if (!enabled) {
      await BluetoothManager.enableBluetooth();
    }

    // Get list of already paired devices
    const paired = await BluetoothManager.scanDevices();
    const devices = JSON.parse(paired);
    return devices.paired || [];
  } catch (error) {
    console.error('Error getting paired devices:', error);
    throw error;
  }
};

// Connect to a specific printer
export const connectPrinter = async (address) => {
  try {
    const { BluetoothManager } = ensureBluetoothModules();
    await BluetoothManager.connect(address);
    return true;
  } catch (error) {
    console.error('Error connecting to printer:', error);
    throw error;
  }
};

// Print the bill
export const printBill = async (billData) => {
  try {
    const { BluetoothEscposPrinter } = ensureBluetoothModules();
    const {
      billNumber,
      customerName,
      items,
      totalAmount,
      discount,
      finalAmount,
      paymentMethod,
      date,
    } = billData;

    // Paper width for 58mm printer = 32 characters per line
    const LINE_WIDTH = 32;
    const DIVIDER = '--------------------------------';

    // Helper to align text left and right on same line
    const alignLeftRight = (left, right) => {
      const space = LINE_WIDTH - left.length - right.length;
      return left + ' '.repeat(Math.max(1, space)) + right;
    };

    // Helper to center text
    const centerText = (text) => {
      const space = Math.floor((LINE_WIDTH - text.length) / 2);
      return ' '.repeat(Math.max(0, space)) + text;
    };

    // ---- START PRINTING ----

    // Shop name header
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText('Tanu Soaps and General\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });
    await BluetoothEscposPrinter.printText('Tax Invoice\n', {});
    await BluetoothEscposPrinter.printText(DIVIDER + '\n', {});

    // Bill details
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT
    );
    await BluetoothEscposPrinter.printText(`Bill: ${billNumber}\n`, {});
    await BluetoothEscposPrinter.printText(`Date: ${date}\n`, {});
    await BluetoothEscposPrinter.printText(`Customer: ${customerName}\n`, {});
    await BluetoothEscposPrinter.printText(DIVIDER + '\n', {});

    // Items header
    await BluetoothEscposPrinter.printText(
      alignLeftRight('Item', 'Qty  Amt') + '\n',
      {}
    );
    await BluetoothEscposPrinter.printText(DIVIDER + '\n', {});

    // Print each item
    for (const item of items) {
      const itemName =
        item.product_name.length > 16
          ? item.product_name.substring(0, 16)
          : item.product_name;
      const qtyAmt = `${item.quantity}  ${item.subtotal.toFixed(2)}`;
      await BluetoothEscposPrinter.printText(
        alignLeftRight(itemName, qtyAmt) + '\n',
        {}
      );
    }

    await BluetoothEscposPrinter.printText(DIVIDER + '\n', {});

    // Totals
    await BluetoothEscposPrinter.printText(
      alignLeftRight('Subtotal:', `${totalAmount.toFixed(2)}`) + '\n',
      {}
    );

    if (discount > 0) {
      await BluetoothEscposPrinter.printText(
        alignLeftRight('Discount:', `-${discount.toFixed(2)}`) + '\n',
        {}
      );
    }

    await BluetoothEscposPrinter.printText(
      alignLeftRight('TOTAL:', `Rs.${finalAmount.toFixed(2)}`) + '\n',
      {}
    );
    await BluetoothEscposPrinter.printText(
      alignLeftRight('Payment:', paymentMethod) + '\n',
      {}
    );

    await BluetoothEscposPrinter.printText(DIVIDER + '\n', {});

    // Footer
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText('Thank you!\n', {});
    await BluetoothEscposPrinter.printText('Visit Again :)\n', {});

    // Feed paper and cut
    await BluetoothEscposPrinter.printText('\n\n\n', {});

    return true;
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
};
