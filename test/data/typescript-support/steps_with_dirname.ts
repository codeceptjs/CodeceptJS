// Test TypeScript file that uses __dirname
import path from 'path'

export default function() {
  return {
    getConfigPath() {
      // This will fail after transpilation because __dirname is not defined in ESM
      return path.join(__dirname, 'config.json')
    },
    
    getCurrentFile() {
      return __filename
    }
  }
}
