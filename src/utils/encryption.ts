import CryptoJS from 'crypto-js';

export interface EncryptedData {
  data: string;
  timestamp: number;
  version: string;
}

export class EncryptionService {
  private static readonly VERSION = '1.0.0';

  static encrypt(data: any, password: string): string {
    try {
      const jsonString = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.VERSION
      });

      const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Ошибка шифрования данных');
    }
  }

  static decrypt(encryptedData: string, password: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Неверный пароль или поврежденные данные');
      }

      const parsedData = JSON.parse(decryptedString);
      
      if (parsedData.version !== this.VERSION) {
        console.warn('Версия данных отличается от текущей');
      }

      return parsedData.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Ошибка дешифрования: ${error.message}`);
      }
      throw new Error('Неизвестная ошибка дешифрования');
    }
  }

  static generatePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static validatePassword(password: string): boolean {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && (hasUpperCase || hasLowerCase) && hasNumbers;
  }
}