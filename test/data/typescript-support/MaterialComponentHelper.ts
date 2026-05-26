// TypeScript custom helper that imports another TypeScript file
// Testing import without extension (should work after fix)
import { AbstractHelper, HelperUtils } from "./abstract-helper";

class MaterialComponentHelper extends AbstractHelper {
  customMethod(): string {
    return HelperUtils.formatMessage('Material component helper loaded');
  }

  async clickButton(selector: string): Promise<void> {
    console.log(`Clicking button: ${selector}`);
  }
}

export default MaterialComponentHelper;
