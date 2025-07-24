import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sheetsService } from './googleSheets';
import { User, AuthUser, LoginCredentials } from '~/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.id,
        mobile: decoded.mobile,
        role: decoded.role,
        name: decoded.name,
        image: decoded.image
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
    try {
      // Find user by mobile
      const user = await sheetsService.getUserByMobile(credentials.mobile);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is disabled');
      }

      // For demo purposes, if password is a 6-digit number, verify directly
      // Otherwise, use bcrypt comparison
      let isPasswordValid = false;
      
      if (credentials.password.length === 6 && /^\d+$/.test(credentials.password)) {
        // Simple 6-digit password check
        isPasswordValid = credentials.password === user.password.substring(user.password.length - 6);
      } else {
        // Hash comparison
        isPasswordValid = await this.comparePassword(credentials.password, user.password);
      }

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
        name: user.name,
        image: user.image
      };

      // Generate token
      const token = this.generateToken(authUser);

      // Log activity
      await sheetsService.addActivityLog({
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        details: 'User logged in',
        createdAt: new Date().toISOString()
      });

      return { user: authUser, token };
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  }

  // Register user (only for superadmin)
  static async register(userData: Partial<User>, createdBy: AuthUser): Promise<User | null> {
    try {
      // Check if user already exists
      const existingUser = await sheetsService.getUserByMobile(userData.mobile!);
      if (existingUser) {
        throw new Error('User with this mobile number already exists');
      }

      // Generate password if not provided (6-digit mobile without 0)
      let password = userData.password;
      if (!password) {
        // Use last 6 digits of mobile as default password
        password = userData.mobile!.slice(-6);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user object
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name!,
        mobile: userData.mobile!,
        password: hashedPassword,
        role: userData.role || 'user',
        image: userData.image || '',
        nidNo: userData.nidNo || '',
        dateOfBirth: userData.dateOfBirth || '',
        totalDue: 0,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add user to database
      const success = await sheetsService.addUser(newUser);
      
      if (success) {
        // Log activity
        await sheetsService.addActivityLog({
          id: Date.now().toString(),
          userId: createdBy.id,
          userName: createdBy.name,
          action: 'CREATE_USER',
          details: `Created user: ${newUser.name} (${newUser.mobile})`,
          createdAt: new Date().toISOString()
        });

        return newUser;
      }

      return null;
    } catch (error) {
      console.error('Registration failed:', error);
      return null;
    }
  }

  // Change password
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await sheetsService.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update user password
      const success = await sheetsService.updateUser(userId, { 
        password: hashedNewPassword 
      });

      if (success) {
        // Log activity
        await sheetsService.addActivityLog({
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          action: 'CHANGE_PASSWORD',
          details: 'Password changed successfully',
          createdAt: new Date().toISOString()
        });
      }

      return success;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  }

  // Check user permissions
  static hasPermission(user: AuthUser, action: string): boolean {
    const permissions = {
      superadmin: [
        'VIEW_DASHBOARD',
        'MANAGE_USERS',
        'MANAGE_SALES',
        'MANAGE_COSTS',
        'VIEW_REPORTS',
        'VIEW_ACTIVITY_LOGS',
        'MANAGE_SETTINGS'
      ],
      manager: [
        'MANAGE_SALES',
        'MANAGE_COSTS',
        'VIEW_LIMITED_REPORTS'
      ],
      user: [
        'VIEW_PROFILE',
        'VIEW_OWN_TRANSACTIONS'
      ]
    };

    return permissions[user.role]?.includes(action) || false;
  }

  // Get user role permissions
  static getUserPermissions(role: string): string[] {
    const permissions = {
      superadmin: [
        'VIEW_DASHBOARD',
        'MANAGE_USERS',
        'MANAGE_SALES',
        'MANAGE_COSTS',
        'VIEW_REPORTS',
        'VIEW_ACTIVITY_LOGS',
        'MANAGE_SETTINGS'
      ],
      manager: [
        'MANAGE_SALES',
        'MANAGE_COSTS',
        'VIEW_LIMITED_REPORTS'
      ],
      user: [
        'VIEW_PROFILE',
        'VIEW_OWN_TRANSACTIONS'
      ]
    };

    return permissions[role as keyof typeof permissions] || [];
  }

  // Middleware for protecting routes
  static requireAuth(requiredRole?: string) {
    return (user: AuthUser | null) => {
      if (!user) {
        return false;
      }

      if (requiredRole) {
        const roleHierarchy = ['user', 'manager', 'superadmin'];
        const userRoleIndex = roleHierarchy.indexOf(user.role);
        const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
        
        return userRoleIndex >= requiredRoleIndex;
      }

      return true;
    };
  }

  // Get user by token
  static async getUserFromToken(token: string): Promise<User | null> {
    try {
      const authUser = this.verifyToken(token);
      if (!authUser) {
        return null;
      }

      return await sheetsService.getUserById(authUser.id);
    } catch (error) {
      console.error('Failed to get user from token:', error);
      return null;
    }
  }

  // Logout (mainly for logging purposes)
  static async logout(userId: string, userName: string): Promise<void> {
    try {
      await sheetsService.addActivityLog({
        id: Date.now().toString(),
        userId,
        userName,
        action: 'LOGOUT',
        details: 'User logged out',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Logout logging failed:', error);
    }
  }

  // Initialize default users if none exist
  static async initializeDefaultUsers(): Promise<void> {
    try {
      const users = await sheetsService.getUsers();
      
      if (users.length === 0) {
        // Create default superadmin
        const defaultPassword = '123456'; // 6-digit password
        const hashedPassword = await this.hashPassword(defaultPassword);

        const superadmin: User = {
          id: '1',
          name: 'সুপার অ্যাডমিন',
          mobile: '1234567890',
          password: hashedPassword,
          role: 'superadmin',
          image: '',
          nidNo: '1234567890123',
          dateOfBirth: '1990-01-01',
          totalDue: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await sheetsService.addUser(superadmin);
        console.log('Default superadmin created with mobile: 1234567890, password: 123456');
      }
    } catch (error) {
      console.error('Failed to initialize default users:', error);
    }
  }

  // Validate mobile number format (Bangladeshi format without leading 0)
  static validateMobile(mobile: string): boolean {
    // Should be 10-11 digits without leading 0
    const mobileRegex = /^[1-9]\d{9,10}$/;
    return mobileRegex.test(mobile);
  }

  // Validate password format (6 digits)
  static validatePassword(password: string): boolean {
    const passwordRegex = /^\d{6}$/;
    return passwordRegex.test(password);
  }

  // Generate mobile-based password
  static generateMobilePassword(mobile: string): string {
    // Use last 6 digits of mobile number
    return mobile.slice(-6);
  }
}

export const authService = AuthService;