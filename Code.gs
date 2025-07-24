// =============================================================================
// Vehicle Management System - Google Apps Script
// Complete Backend with Auto Database Creation
// =============================================================================

// Global Configuration
const CONFIG = {
  SPREADSHEET_NAME: "Vehicle Management Database",
  SHEETS: {
    USERS: "Users",
    SALES: "Sales", 
    COSTS: "Costs",
    DRIVERS: "Drivers",
    COST_TYPES: "CostTypes",
    ACTIVITY_LOGS: "ActivityLogs",
    SETTINGS: "Settings"
  }
};

// =============================================================================
// MAIN WEBAPP FUNCTIONS
// =============================================================================

function doGet(e) {
  try {
    // Initialize database if not exists
    initializeDatabase();
    
    // Create and return HTML page
    const htmlOutput = HtmlService.createTemplateFromFile('index');
    return htmlOutput.evaluate()
      .setTitle('Vehicle Management System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  } catch (error) {
    console.error('doGet Error:', error);
    return HtmlService.createHtmlOutput(`
      <h1>Error Loading Application</h1>
      <p>Error: ${error.toString()}</p>
      <p>Please refresh the page or contact administrator.</p>
    `);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

function initializeDatabase() {
  try {
    let ss = getOrCreateSpreadsheet();
    
    // Create all required sheets
    createSheet(ss, CONFIG.SHEETS.USERS, [
      'ID', 'Name', 'Mobile', 'Password', 'Role', 'Image', 'NID No', 
      'Date of Birth', 'Total Due', 'Is Active', 'Created At', 'Updated At'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.SALES, [
      'ID', 'User ID', 'User Name', 'Driver ID', 'Driver Name', 
      'Charge Type', 'Charge Amount', 'Due Amount', 'Due Collection', 
      'Total Due', 'Created At', 'Created By'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.COSTS, [
      'ID', 'Type', 'Amount', 'Description', 'Created At', 'Created By'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.DRIVERS, [
      'ID', 'Name', 'Mobile', 'Created At'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.COST_TYPES, [
      'ID', 'Name', 'Is Active'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.ACTIVITY_LOGS, [
      'ID', 'User ID', 'User Name', 'Action', 'Details', 
      'IP Address', 'User Agent', 'Created At'
    ]);
    
    createSheet(ss, CONFIG.SHEETS.SETTINGS, [
      'Key', 'Value', 'Description', 'Updated At'
    ]);
    
    // Create demo data
    createDemoData(ss);
    
    console.log('Database initialized successfully');
    return ss;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw new Error('Failed to initialize database: ' + error.toString());
  }
}

function getOrCreateSpreadsheet() {
  try {
    // Try to find existing spreadsheet
    const files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }
    
    // Create new spreadsheet
    const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    console.log('Created new spreadsheet:', ss.getId());
    return ss;
  } catch (error) {
    console.error('Error creating/opening spreadsheet:', error);
    throw new Error('Failed to create or open spreadsheet');
  }
}

function createSheet(ss, sheetName, headers) {
  try {
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      console.log('Created sheet:', sheetName);
    }
    
    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
      
      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }
    
    return sheet;
  } catch (error) {
    console.error('Error creating sheet:', sheetName, error);
    throw error;
  }
}

function createDemoData(ss) {
  try {
    // Create demo users
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    if (usersSheet.getLastRow() <= 1) {
      const demoUsers = [
        ['1', 'সুপার অ্যাডমিন', '1234567890', '123456', 'superadmin', '', '1234567890123', '1990-01-01', 0, 'TRUE', new Date(), new Date()],
        ['2', 'ম্যানেজার', '1234567891', '123456', 'manager', '', '1234567890124', '1985-01-01', 0, 'TRUE', new Date(), new Date()],
        ['3', 'ব্যবহারকারী', '1234567892', '123456', 'user', '', '1234567890125', '1995-01-01', 500, 'TRUE', new Date(), new Date()]
      ];
      
      usersSheet.getRange(2, 1, demoUsers.length, demoUsers[0].length).setValues(demoUsers);
    }
    
    // Create demo drivers
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    if (driversSheet.getLastRow() <= 1) {
      const demoDrivers = [
        ['1', 'রহিম ড্রাইভার', '1234567893', new Date()],
        ['2', 'করিম ড্রাইভার', '1234567894', new Date()]
      ];
      
      driversSheet.getRange(2, 1, demoDrivers.length, demoDrivers[0].length).setValues(demoDrivers);
    }
    
    // Create demo cost types
    const costTypesSheet = ss.getSheetByName(CONFIG.SHEETS.COST_TYPES);
    if (costTypesSheet.getLastRow() <= 1) {
      const demoCostTypes = [
        ['1', 'জিপি', 'TRUE'],
        ['2', 'সার্ভিসিং', 'TRUE'],
        ['3', 'অন্যান্য', 'TRUE']
      ];
      
      costTypesSheet.getRange(2, 1, demoCostTypes.length, demoCostTypes[0].length).setValues(demoCostTypes);
    }
    
    console.log('Demo data created successfully');
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

function authenticateUser(mobile, password) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userMobile = row[2].toString();
      const userPassword = row[3].toString();
      const isActive = row[9].toString().toUpperCase() === 'TRUE';
      
      if (userMobile === mobile && userPassword === password && isActive) {
        const user = {
          id: row[0],
          name: row[1],
          mobile: row[2],
          role: row[4],
          image: row[5],
          nidNo: row[6],
          dateOfBirth: row[7],
          totalDue: row[8],
          isActive: isActive
        };
        
        // Log activity
        logActivity(user.id, user.name, 'LOGIN', 'User logged in successfully');
        
        return {
          success: true,
          user: user,
          message: 'লগইন সফল'
        };
      }
    }
    
    return {
      success: false,
      message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'লগইন করতে সমস্যা হয়েছে'
    };
  }
}

// =============================================================================
// USER MANAGEMENT FUNCTIONS
// =============================================================================

function getUsers(userRole) {
  try {
    if (userRole !== 'superadmin') {
      return { success: false, message: 'অনুমতি নেই' };
    }
    
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        id: row[0],
        name: row[1],
        mobile: row[2],
        role: row[4],
        image: row[5],
        nidNo: row[6],
        dateOfBirth: row[7],
        totalDue: row[8],
        isActive: row[9].toString().toUpperCase() === 'TRUE',
        createdAt: row[10],
        updatedAt: row[11]
      });
    }
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, message: 'ব্যবহারকারী তালিকা লোড করতে সমস্যা' };
  }
}

function addUser(userData, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    
    // Generate new ID
    const lastRow = usersSheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(usersSheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    const newUser = [
      newId,
      userData.name,
      userData.mobile,
      userData.password || userData.mobile.slice(-6), // Default password is last 6 digits
      userData.role || 'user',
      userData.image || '',
      userData.nidNo || '',
      userData.dateOfBirth || '',
      0, // Initial total due
      'TRUE', // Active by default
      new Date(),
      new Date()
    ];
    
    usersSheet.appendRow(newUser);
    
    // Log activity
    logActivity(currentUserId, 'System', 'CREATE_USER', `নতুন ব্যবহারকারী তৈরি: ${userData.name}`);
    
    return { success: true, message: 'ব্যবহারকারী সফলভাবে যোগ করা হয়েছে' };
  } catch (error) {
    console.error('Add user error:', error);
    return { success: false, message: 'ব্যবহারকারী যোগ করতে সমস্যা' };
  }
}

function updateUser(userId, userData, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        // Update user data
        if (userData.name) usersSheet.getRange(i + 1, 2).setValue(userData.name);
        if (userData.mobile) usersSheet.getRange(i + 1, 3).setValue(userData.mobile);
        if (userData.password) usersSheet.getRange(i + 1, 4).setValue(userData.password);
        if (userData.role) usersSheet.getRange(i + 1, 5).setValue(userData.role);
        if (userData.image !== undefined) usersSheet.getRange(i + 1, 6).setValue(userData.image);
        if (userData.nidNo !== undefined) usersSheet.getRange(i + 1, 7).setValue(userData.nidNo);
        if (userData.dateOfBirth !== undefined) usersSheet.getRange(i + 1, 8).setValue(userData.dateOfBirth);
        if (userData.totalDue !== undefined) usersSheet.getRange(i + 1, 9).setValue(userData.totalDue);
        if (userData.isActive !== undefined) usersSheet.getRange(i + 1, 10).setValue(userData.isActive ? 'TRUE' : 'FALSE');
        usersSheet.getRange(i + 1, 12).setValue(new Date()); // Updated at
        
        logActivity(currentUserId, 'System', 'UPDATE_USER', `ব্যবহারকারী আপডেট: ${userData.name || userId}`);
        return { success: true, message: 'ব্যবহারকারী সফলভাবে আপডেট হয়েছে' };
      }
    }
    
    return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, message: 'ব্যবহারকারী আপডেট করতে সমস্যা' };
  }
}

function deleteUser(userId, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        const userName = data[i][1];
        usersSheet.deleteRow(i + 1);
        
        logActivity(currentUserId, 'System', 'DELETE_USER', `ব্যবহারকারী মুছে ফেলা: ${userName}`);
        return { success: true, message: 'ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে' };
      }
    }
    
    return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, message: 'ব্যবহারকারী মুছতে সমস্যা' };
  }
}

// =============================================================================
// SALES MANAGEMENT FUNCTIONS
// =============================================================================

function getSales(userRole, userId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const salesSheet = ss.getSheetByName(CONFIG.SHEETS.SALES);
    const data = salesSheet.getDataRange().getValues();
    
    const sales = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Filter for regular users - only show their own sales
      if (userRole === 'user' && row[1].toString() !== userId.toString()) {
        continue;
      }
      
      sales.push({
        id: row[0],
        userId: row[1],
        userName: row[2],
        driverId: row[3],
        driverName: row[4],
        chargeType: row[5],
        chargeAmount: row[6],
        dueAmount: row[7],
        dueCollection: row[8],
        totalDue: row[9],
        createdAt: row[10],
        createdBy: row[11]
      });
    }
    
    return { success: true, data: sales };
  } catch (error) {
    console.error('Get sales error:', error);
    return { success: false, message: 'বিক্রয় তালিকা লোড করতে সমস্যা' };
  }
}

function addSale(saleData, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const salesSheet = ss.getSheetByName(CONFIG.SHEETS.SALES);
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    
    // Generate new ID
    const lastRow = salesSheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(salesSheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    // Get user and driver names
    const userName = getUserName(saleData.userId);
    const driverName = getDriverName(saleData.driverId);
    
    const newSale = [
      newId,
      saleData.userId,
      userName,
      saleData.driverId,
      driverName,
      saleData.chargeType,
      saleData.chargeAmount || 0,
      saleData.dueAmount || 0,
      saleData.dueCollection || 0,
      (saleData.dueAmount || 0) - (saleData.dueCollection || 0),
      new Date(),
      currentUserId
    ];
    
    salesSheet.appendRow(newSale);
    
    // Update user's total due
    updateUserTotalDue(saleData.userId, (saleData.dueAmount || 0) - (saleData.dueCollection || 0));
    
    logActivity(currentUserId, 'System', 'ADD_SALE', `নতুন বিক্রয় যোগ: ${userName}`);
    
    return { success: true, message: 'বিক্রয় সফলভাবে যোগ করা হয়েছে' };
  } catch (error) {
    console.error('Add sale error:', error);
    return { success: false, message: 'বিক্রয় যোগ করতে সমস্যা' };
  }
}

// =============================================================================
// COST MANAGEMENT FUNCTIONS
// =============================================================================

function getCosts() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const costsSheet = ss.getSheetByName(CONFIG.SHEETS.COSTS);
    const data = costsSheet.getDataRange().getValues();
    
    const costs = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      costs.push({
        id: row[0],
        type: row[1],
        amount: row[2],
        description: row[3],
        createdAt: row[4],
        createdBy: row[5]
      });
    }
    
    return { success: true, data: costs };
  } catch (error) {
    console.error('Get costs error:', error);
    return { success: false, message: 'খরচ তালিকা লোড করতে সমস্যা' };
  }
}

function addCost(costData, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const costsSheet = ss.getSheetByName(CONFIG.SHEETS.COSTS);
    
    // Generate new ID
    const lastRow = costsSheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(costsSheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    const newCost = [
      newId,
      costData.type,
      costData.amount,
      costData.description || '',
      new Date(),
      currentUserId
    ];
    
    costsSheet.appendRow(newCost);
    
    logActivity(currentUserId, 'System', 'ADD_COST', `নতুন খরচ যোগ: ${costData.type} - ${costData.amount}`);
    
    return { success: true, message: 'খরচ সফলভাবে যোগ করা হয়েছে' };
  } catch (error) {
    console.error('Add cost error:', error);
    return { success: false, message: 'খরচ যোগ করতে সমস্যা' };
  }
}

// =============================================================================
// DRIVER MANAGEMENT FUNCTIONS
// =============================================================================

function getDrivers() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    const data = driversSheet.getDataRange().getValues();
    
    const drivers = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      drivers.push({
        id: row[0],
        name: row[1],
        mobile: row[2],
        createdAt: row[3]
      });
    }
    
    return { success: true, data: drivers };
  } catch (error) {
    console.error('Get drivers error:', error);
    return { success: false, message: 'ড্রাইভার তালিকা লোড করতে সমস্যা' };
  }
}

function addDriver(driverData, currentUserId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    
    // Generate new ID
    const lastRow = driversSheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(driversSheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    const newDriver = [
      newId,
      driverData.name,
      driverData.mobile || '',
      new Date()
    ];
    
    driversSheet.appendRow(newDriver);
    
    logActivity(currentUserId, 'System', 'ADD_DRIVER', `নতুন ড্রাইভার যোগ: ${driverData.name}`);
    
    return { 
      success: true, 
      message: 'ড্রাইভার সফলভাবে যোগ করা হয়েছে',
      data: { id: newId, name: driverData.name, mobile: driverData.mobile || '' }
    };
  } catch (error) {
    console.error('Add driver error:', error);
    return { success: false, message: 'ড্রাইভার যোগ করতে সমস্যা' };
  }
}

// =============================================================================
// COST TYPES MANAGEMENT FUNCTIONS
// =============================================================================

function getCostTypes() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const costTypesSheet = ss.getSheetByName(CONFIG.SHEETS.COST_TYPES);
    const data = costTypesSheet.getDataRange().getValues();
    
    const costTypes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2].toString().toUpperCase() === 'TRUE') {
        costTypes.push({
          id: row[0],
          name: row[1],
          isActive: true
        });
      }
    }
    
    return { success: true, data: costTypes };
  } catch (error) {
    console.error('Get cost types error:', error);
    return { success: false, message: 'খরচের ধরন লোড করতে সমস্যা' };
  }
}

// =============================================================================
// DASHBOARD FUNCTIONS
// =============================================================================

function getDashboardStats() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    
    // Get sales data
    const salesSheet = ss.getSheetByName(CONFIG.SHEETS.SALES);
    const salesData = salesSheet.getDataRange().getValues();
    
    let totalSales = 0;
    let totalDue = 0;
    
    for (let i = 1; i < salesData.length; i++) {
      totalSales += Number(salesData[i][6] || 0); // Charge Amount
      totalDue += Number(salesData[i][9] || 0); // Total Due
    }
    
    // Get costs data
    const costsSheet = ss.getSheetByName(CONFIG.SHEETS.COSTS);
    const costsData = costsSheet.getDataRange().getValues();
    
    let totalCost = 0;
    for (let i = 1; i < costsData.length; i++) {
      totalCost += Number(costsData[i][2] || 0); // Amount
    }
    
    // Get users count
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const totalUsers = usersSheet.getLastRow() - 1; // Exclude header
    
    // Get drivers count (total auto)
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    const totalAuto = driversSheet.getLastRow() - 1; // Exclude header
    
    const totalCash = totalSales - totalCost;
    
    // Get recent sales (last 5)
    const recentSales = [];
    const startRow = Math.max(2, salesData.length - 4); // Last 5 rows
    for (let i = startRow; i < salesData.length; i++) {
      const row = salesData[i];
      recentSales.push({
        id: row[0],
        userName: row[2],
        chargeAmount: row[6],
        createdAt: formatDate(row[10])
      });
    }
    
    // Get recent costs (last 5)
    const recentCosts = [];
    const costStartRow = Math.max(2, costsData.length - 4); // Last 5 rows
    for (let i = costStartRow; i < costsData.length; i++) {
      const row = costsData[i];
      recentCosts.push({
        id: row[0],
        type: row[1],
        amount: row[2],
        createdAt: formatDate(row[4])
      });
    }
    
    return {
      success: true,
      data: {
        totalSales: totalSales,
        totalDue: totalDue,
        totalCost: totalCost,
        totalCash: totalCash,
        totalAuto: totalAuto,
        totalUsers: totalUsers,
        recentSales: recentSales.reverse(),
        recentCosts: recentCosts.reverse()
      }
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return { success: false, message: 'ড্যাশবোর্ড তথ্য লোড করতে সমস্যা' };
  }
}

// =============================================================================
// PROFILE FUNCTIONS
// =============================================================================

function getUserProfile(userId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const salesSheet = ss.getSheetByName(CONFIG.SHEETS.SALES);
    
    // Get user data
    const usersData = usersSheet.getDataRange().getValues();
    let user = null;
    
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0].toString() === userId.toString()) {
        user = {
          id: usersData[i][0],
          name: usersData[i][1],
          mobile: usersData[i][2],
          role: usersData[i][4],
          image: usersData[i][5],
          nidNo: usersData[i][6],
          dateOfBirth: usersData[i][7],
          totalDue: usersData[i][8],
          isActive: usersData[i][9],
          createdAt: usersData[i][10]
        };
        break;
      }
    }
    
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    }
    
    // Get user transactions
    const salesData = salesSheet.getDataRange().getValues();
    const transactions = [];
    let chargeBills = 0;
    let noChargeBills = 0;
    let dueCollections = 0;
    
    for (let i = 1; i < salesData.length; i++) {
      if (salesData[i][1].toString() === userId.toString()) {
        const row = salesData[i];
        transactions.push({
          id: row[0],
          driverName: row[4],
          chargeType: row[5],
          chargeAmount: row[6],
          dueAmount: row[7],
          dueCollection: row[8],
          createdAt: formatDate(row[10])
        });
        
        if (row[5] === 'chargeBill') {
          chargeBills += Number(row[6] || 0);
        } else {
          noChargeBills += Number(row[6] || 0);
        }
        dueCollections += Number(row[8] || 0);
      }
    }
    
    return {
      success: true,
      data: {
        user: user,
        transactions: transactions.reverse(), // Latest first
        monthlyStats: {
          chargeBills: chargeBills,
          noChargeBills: noChargeBills,
          dueCollections: dueCollections,
          totalDue: user.totalDue
        }
      }
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, message: 'প্রোফাইল লোড করতে সমস্যা' };
  }
}

// =============================================================================
// REPORTS FUNCTIONS
// =============================================================================

function generateReport(reportType, startDate, endDate) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const salesSheet = ss.getSheetByName(CONFIG.SHEETS.SALES);
    const costsSheet = ss.getSheetByName(CONFIG.SHEETS.COSTS);
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    
    // Get date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    // Filter sales data
    const salesData = salesSheet.getDataRange().getValues();
    const filteredSales = [];
    let totalSales = 0;
    let totalDue = 0;
    
    for (let i = 1; i < salesData.length; i++) {
      const row = salesData[i];
      const createdDate = new Date(row[10]);
      
      if (createdDate >= start && createdDate <= end) {
        filteredSales.push({
          id: row[0],
          userName: row[2],
          driverName: row[4],
          chargeType: row[5],
          chargeAmount: row[6],
          dueAmount: row[7],
          dueCollection: row[8],
          totalDue: row[9],
          createdAt: formatDate(row[10])
        });
        
        totalSales += Number(row[6] || 0);
        totalDue += Number(row[9] || 0);
      }
    }
    
    // Filter costs data
    const costsData = costsSheet.getDataRange().getValues();
    const filteredCosts = [];
    let totalCost = 0;
    
    for (let i = 1; i < costsData.length; i++) {
      const row = costsData[i];
      const createdDate = new Date(row[4]);
      
      if (createdDate >= start && createdDate <= end) {
        filteredCosts.push({
          id: row[0],
          type: row[1],
          amount: row[2],
          description: row[3],
          createdAt: formatDate(row[4])
        });
        
        totalCost += Number(row[2] || 0);
      }
    }
    
    const totalAuto = driversSheet.getLastRow() - 1;
    const totalCash = totalSales - totalCost;
    
    return {
      success: true,
      data: {
        reportType: reportType,
        period: `${formatDate(start)} থেকে ${formatDate(end)}`,
        totalAuto: totalAuto,
        totalSales: totalSales,
        totalDue: totalDue,
        totalCost: totalCost,
        totalCash: totalCash,
        salesSummary: filteredSales,
        costSummary: filteredCosts
      }
    };
  } catch (error) {
    console.error('Generate report error:', error);
    return { success: false, message: 'রিপোর্ট তৈরি করতে সমস্যা' };
  }
}

// =============================================================================
// SETTINGS FUNCTIONS
// =============================================================================

function changePassword(userId, currentPassword, newPassword) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        if (data[i][3].toString() !== currentPassword) {
          return { success: false, message: 'বর্তমান পাসওয়ার্ড ভুল' };
        }
        
        usersSheet.getRange(i + 1, 4).setValue(newPassword);
        usersSheet.getRange(i + 1, 12).setValue(new Date()); // Updated at
        
        logActivity(userId, data[i][1], 'CHANGE_PASSWORD', 'পাসওয়ার্ড পরিবর্তন করা হয়েছে');
        
        return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' };
      }
    }
    
    return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, message: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা' };
  }
}

// =============================================================================
// ACTIVITY LOG FUNCTIONS
// =============================================================================

function logActivity(userId, userName, action, details) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const activitySheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOGS);
    
    const lastRow = activitySheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(activitySheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    const newLog = [
      newId,
      userId,
      userName,
      action,
      details,
      '', // IP Address (not available in Apps Script)
      '', // User Agent (not available in Apps Script)
      new Date()
    ];
    
    activitySheet.appendRow(newLog);
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

function getActivityLogs() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const activitySheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOGS);
    const data = activitySheet.getDataRange().getValues();
    
    const logs = [];
    // Get last 50 logs
    const startRow = Math.max(1, data.length - 50);
    
    for (let i = startRow; i < data.length; i++) {
      if (i === 0) continue; // Skip header
      const row = data[i];
      logs.push({
        id: row[0],
        userId: row[1],
        userName: row[2],
        action: row[3],
        details: row[4],
        createdAt: formatDate(row[7])
      });
    }
    
    return { success: true, data: logs.reverse() };
  } catch (error) {
    console.error('Get activity logs error:', error);
    return { success: false, message: 'কার্যকলাপ লগ লোড করতে সমস্যা' };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getSpreadsheetId() {
  try {
    const files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
    if (files.hasNext()) {
      return files.next().getId();
    }
    throw new Error('Spreadsheet not found');
  } catch (error) {
    console.error('Get spreadsheet ID error:', error);
    throw error;
  }
}

function getUserName(userId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        return data[i][1];
      }
    }
    return 'Unknown User';
  } catch (error) {
    console.error('Get user name error:', error);
    return 'Unknown User';
  }
}

function getDriverName(driverId) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const driversSheet = ss.getSheetByName(CONFIG.SHEETS.DRIVERS);
    const data = driversSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === driverId.toString()) {
        return data[i][1];
      }
    }
    return 'Unknown Driver';
  } catch (error) {
    console.error('Get driver name error:', error);
    return 'Unknown Driver';
  }
}

function updateUserTotalDue(userId, dueChange) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        const currentDue = Number(data[i][8] || 0);
        const newDue = currentDue + Number(dueChange);
        usersSheet.getRange(i + 1, 9).setValue(newDue);
        usersSheet.getRange(i + 1, 12).setValue(new Date()); // Updated at
        break;
      }
    }
  } catch (error) {
    console.error('Update user total due error:', error);
  }
}

function formatDate(date) {
  try {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  } catch (error) {
    return '৳' + (amount || 0);
  }
}

// =============================================================================
// API ENDPOINTS FOR FRONTEND
// =============================================================================

function handleApiRequest(endpoint, method, data, userId, userRole) {
  try {
    switch (endpoint) {
      case 'authenticate':
        return authenticateUser(data.mobile, data.password);
        
      case 'dashboard':
        return getDashboardStats();
        
      case 'users':
        if (method === 'GET') return getUsers(userRole);
        if (method === 'POST') return addUser(data, userId);
        if (method === 'PUT') return updateUser(data.id, data, userId);
        if (method === 'DELETE') return deleteUser(data.id, userId);
        break;
        
      case 'sales':
        if (method === 'GET') return getSales(userRole, userId);
        if (method === 'POST') return addSale(data, userId);
        break;
        
      case 'costs':
        if (method === 'GET') return getCosts();
        if (method === 'POST') return addCost(data, userId);
        break;
        
      case 'drivers':
        if (method === 'GET') return getDrivers();
        if (method === 'POST') return addDriver(data, userId);
        break;
        
      case 'cost-types':
        return getCostTypes();
        
      case 'profile':
        return getUserProfile(data.userId || userId);
        
      case 'reports':
        return generateReport(data.reportType, data.startDate, data.endDate);
        
      case 'change-password':
        return changePassword(userId, data.currentPassword, data.newPassword);
        
      case 'activity-logs':
        return getActivityLogs();
        
      default:
        return { success: false, message: 'Invalid endpoint' };
    }
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, message: 'API request failed: ' + error.toString() };
  }
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

function testInitialization() {
  try {
    const result = initializeDatabase();
    console.log('Database initialization test:', result ? 'SUCCESS' : 'FAILED');
    return result;
  } catch (error) {
    console.error('Database initialization test failed:', error);
    return false;
  }
}

function testAuthentication() {
  try {
    const result = authenticateUser('1234567890', '123456');
    console.log('Authentication test:', result);
    return result.success;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}