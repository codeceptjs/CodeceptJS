// Import from root level without .ts extension (TypeScript style)
import { apiUrl, timeout } from '../environments';

export function getConfig() {
  return {
    endpoint: apiUrl,
    timeout: timeout
  };
}
