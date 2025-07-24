import { google } from 'googleapis';
import { User, Sale, Cost, Driver, CostType, ActivityLog, SheetConfig } from '~/types';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || 'your-spreadsheet-id';
const GOOGLE_CREDENTIALS = process.env.GOOGLE_CREDENTIALS || '';

const SHEET_NAMES = {
  users: 'Users',
  sales: 'Sales',
  costs: 'Costs',
  drivers: 'Drivers',
  costTypes: 'CostTypes',
  activityLogs: 'ActivityLogs'
};

class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const credentials = JSON.parse(GOOGLE_CREDENTIALS);
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  // Initialize spreadsheet with headers
  async initializeSpreadsheet(): Promise<boolean> {
    try {
      // Create sheets with headers
      await this.createSheetIfNotExists(SHEET_NAMES.users, [
        'ID', 'Name', 'Mobile', 'Password', 'Role', 'Image', 'NID No', 'Date of Birth', 'Total Due', 'Is Active', 'Created At', 'Updated At'
      ]);

      await this.createSheetIfNotExists(SHEET_NAMES.sales, [
        'ID', 'User ID', 'User Name', 'Driver ID', 'Driver Name', 'Charge Type', 'Charge Amount', 'Due Amount', 'Due Collection', 'Total Due', 'Created At', 'Created By'
      ]);

      await this.createSheetIfNotExists(SHEET_NAMES.costs, [
        'ID', 'Type', 'Amount', 'Description', 'Created At', 'Created By'
      ]);

      await this.createSheetIfNotExists(SHEET_NAMES.drivers, [
        'ID', 'Name', 'Mobile', 'Created At'
      ]);

      await this.createSheetIfNotExists(SHEET_NAMES.costTypes, [
        'ID', 'Name', 'Is Active'
      ]);

      await this.createSheetIfNotExists(SHEET_NAMES.activityLogs, [
        'ID', 'User ID', 'User Name', 'Action', 'Details', 'IP Address', 'User Agent', 'Created At'
      ]);

      // Create demo data
      await this.createDemoData();

      return true;
    } catch (error) {
      console.error('Failed to initialize spreadsheet:', error);
      return false;
    }
  }

  private async createSheetIfNotExists(sheetName: string, headers: string[]): Promise<void> {
    try {
      // Check if sheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet: any) => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        // Create new sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });
      }

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });
    } catch (error) {
      console.error(`Failed to create sheet ${sheetName}:`, error);
    }
  }

  private async createDemoData(): Promise<void> {
    try {
      // Create default superadmin user
      const superadmin: User = {
        id: '1',
        name: 'সুপার অ্যাডমিন',
        mobile: '1234567890',
        password: '$2a$10$hashedPassword', // Will be hashed properly
        role: 'superadmin',
        image: '',
        nidNo: '1234567890123',
        dateOfBirth: '1990-01-01',
        totalDue: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create demo manager
      const manager: User = {
        id: '2',
        name: 'ম্যানেজার',
        mobile: '1234567891',
        password: '$2a$10$hashedPassword',
        role: 'manager',
        image: '',
        nidNo: '1234567890124',
        dateOfBirth: '1985-01-01',
        totalDue: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create demo user
      const user: User = {
        id: '3',
        name: 'ব্যবহারকারী',
        mobile: '1234567892',
        password: '$2a$10$hashedPassword',
        role: 'user',
        image: '',
        nidNo: '1234567890125',
        dateOfBirth: '1995-01-01',
        totalDue: 500,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.addUser(superadmin);
      await this.addUser(manager);
      await this.addUser(user);

      // Create demo drivers
      const drivers = [
        { id: '1', name: 'রহিম ড্রাইভার', mobile: '1234567893', createdAt: new Date().toISOString() },
        { id: '2', name: 'করিম ড্রাইভার', mobile: '1234567894', createdAt: new Date().toISOString() }
      ];

      for (const driver of drivers) {
        await this.addDriver(driver);
      }

      // Create demo cost types
      const costTypes = [
        { id: '1', name: 'জিপি', isActive: true },
        { id: '2', name: 'সার্ভিসিং', isActive: true },
        { id: '3', name: 'অন্যান্য', isActive: true }
      ];

      for (const costType of costTypes) {
        await this.addCostType(costType);
      }

    } catch (error) {
      console.error('Failed to create demo data:', error);
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.users}!A2:L1000`
      });

      const rows = response.data.values || [];
      return rows.map(this.mapRowToUser);
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  async getUserByMobile(mobile: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.mobile === mobile) || null;
  }

  async addUser(user: User): Promise<boolean> {
    try {
      const values = [
        user.id,
        user.name,
        user.mobile,
        user.password,
        user.role,
        user.image || '',
        user.nidNo || '',
        user.dateOfBirth || '',
        user.totalDue,
        user.isActive,
        user.createdAt,
        user.updatedAt
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.users}!A:L`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add user:', error);
      return false;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(user => user.id === id);
      
      if (userIndex === -1) return false;

      const updatedUser = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
      const values = [
        updatedUser.id,
        updatedUser.name,
        updatedUser.mobile,
        updatedUser.password,
        updatedUser.role,
        updatedUser.image || '',
        updatedUser.nidNo || '',
        updatedUser.dateOfBirth || '',
        updatedUser.totalDue,
        updatedUser.isActive,
        updatedUser.createdAt,
        updatedUser.updatedAt
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.users}!A${userIndex + 2}:L${userIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(user => user.id === id);
      
      if (userIndex === -1) return false;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming users sheet is first
                dimension: 'ROWS',
                startIndex: userIndex + 1,
                endIndex: userIndex + 2
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Sales operations
  async getSales(userId?: string): Promise<Sale[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.sales}!A2:L1000`
      });

      const rows = response.data.values || [];
      let sales = rows.map(this.mapRowToSale);
      
      if (userId) {
        sales = sales.filter(sale => sale.userId === userId);
      }

      return sales;
    } catch (error) {
      console.error('Failed to get sales:', error);
      return [];
    }
  }

  async addSale(sale: Sale): Promise<boolean> {
    try {
      const values = [
        sale.id,
        sale.userId,
        sale.userName,
        sale.driverId,
        sale.driverName,
        sale.chargeType,
        sale.chargeAmount,
        sale.dueAmount,
        sale.dueCollection,
        sale.totalDue,
        sale.createdAt,
        sale.createdBy
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.sales}!A:L`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      // Update user's total due
      await this.updateUserTotalDue(sale.userId, sale.dueAmount - sale.dueCollection);

      return true;
    } catch (error) {
      console.error('Failed to add sale:', error);
      return false;
    }
  }

  // Cost operations
  async getCosts(): Promise<Cost[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.costs}!A2:F1000`
      });

      const rows = response.data.values || [];
      return rows.map(this.mapRowToCost);
    } catch (error) {
      console.error('Failed to get costs:', error);
      return [];
    }
  }

  async addCost(cost: Cost): Promise<boolean> {
    try {
      const values = [
        cost.id,
        cost.type,
        cost.amount,
        cost.description || '',
        cost.createdAt,
        cost.createdBy
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.costs}!A:F`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add cost:', error);
      return false;
    }
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.drivers}!A2:D1000`
      });

      const rows = response.data.values || [];
      return rows.map(this.mapRowToDriver);
    } catch (error) {
      console.error('Failed to get drivers:', error);
      return [];
    }
  }

  async addDriver(driver: Driver): Promise<boolean> {
    try {
      const values = [
        driver.id,
        driver.name,
        driver.mobile || '',
        driver.createdAt
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.drivers}!A:D`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add driver:', error);
      return false;
    }
  }

  // Cost Type operations
  async getCostTypes(): Promise<CostType[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.costTypes}!A2:C1000`
      });

      const rows = response.data.values || [];
      return rows.map(this.mapRowToCostType);
    } catch (error) {
      console.error('Failed to get cost types:', error);
      return [];
    }
  }

  async addCostType(costType: CostType): Promise<boolean> {
    try {
      const values = [
        costType.id,
        costType.name,
        costType.isActive
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.costTypes}!A:C`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add cost type:', error);
      return false;
    }
  }

  // Activity Log operations
  async addActivityLog(log: ActivityLog): Promise<boolean> {
    try {
      const values = [
        log.id,
        log.userId,
        log.userName,
        log.action,
        log.details,
        log.ipAddress || '',
        log.userAgent || '',
        log.createdAt
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.activityLogs}!A:H`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add activity log:', error);
      return false;
    }
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.activityLogs}!A2:H1000`
      });

      const rows = response.data.values || [];
      return rows.map(this.mapRowToActivityLog);
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return [];
    }
  }

  // Utility methods
  private async updateUserTotalDue(userId: string, dueChange: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      const newTotalDue = user.totalDue + dueChange;
      await this.updateUser(userId, { totalDue: newTotalDue });
    }
  }

  // Mapping functions
  private mapRowToUser(row: any[]): User {
    return {
      id: row[0] || '',
      name: row[1] || '',
      mobile: row[2] || '',
      password: row[3] || '',
      role: row[4] || 'user',
      image: row[5] || '',
      nidNo: row[6] || '',
      dateOfBirth: row[7] || '',
      totalDue: parseFloat(row[8]) || 0,
      isActive: row[9] === 'true' || row[9] === true,
      createdAt: row[10] || '',
      updatedAt: row[11] || ''
    };
  }

  private mapRowToSale(row: any[]): Sale {
    return {
      id: row[0] || '',
      userId: row[1] || '',
      userName: row[2] || '',
      driverId: row[3] || '',
      driverName: row[4] || '',
      chargeType: row[5] || 'chargeBill',
      chargeAmount: parseFloat(row[6]) || 0,
      dueAmount: parseFloat(row[7]) || 0,
      dueCollection: parseFloat(row[8]) || 0,
      totalDue: parseFloat(row[9]) || 0,
      createdAt: row[10] || '',
      createdBy: row[11] || ''
    };
  }

  private mapRowToCost(row: any[]): Cost {
    return {
      id: row[0] || '',
      type: row[1] || '',
      amount: parseFloat(row[2]) || 0,
      description: row[3] || '',
      createdAt: row[4] || '',
      createdBy: row[5] || ''
    };
  }

  private mapRowToDriver(row: any[]): Driver {
    return {
      id: row[0] || '',
      name: row[1] || '',
      mobile: row[2] || '',
      createdAt: row[3] || ''
    };
  }

  private mapRowToCostType(row: any[]): CostType {
    return {
      id: row[0] || '',
      name: row[1] || '',
      isActive: row[2] === 'true' || row[2] === true
    };
  }

  private mapRowToActivityLog(row: any[]): ActivityLog {
    return {
      id: row[0] || '',
      userId: row[1] || '',
      userName: row[2] || '',
      action: row[3] || '',
      details: row[4] || '',
      ipAddress: row[5] || '',
      userAgent: row[6] || '',
      createdAt: row[7] || ''
    };
  }
}

export const sheetsService = new GoogleSheetsService();