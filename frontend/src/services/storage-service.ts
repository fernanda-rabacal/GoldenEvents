export class StorageService {
  getStorageValue(key: string) {
    let value = localStorage.getItem(key);

    if (value) {
        value = JSON.parse(value);
    }

    return value;
  }

  setStorageValue(key: string, value: any) {
    let formattedValue = value;

    if (typeof value !== 'string' || typeof value !== 'number') {
        formattedValue = JSON.stringify(value)
    }

    return localStorage.setItem(key, formattedValue);
  }
}