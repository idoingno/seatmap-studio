/**
 * Matrix Operations Utils
 *
 * Shared logic for matrix menu nodes (AddMenuNode, MinusMenuNode)
 */

import type { Node } from "@antv/x6";
import { message } from "./message";

/**
 * Safety check: verify all required anchor groups exist
 */
export function hasAllMatrixAnchors(...groups: Node[][]): boolean {
  return groups.every((group) => group.length > 0);
}

/**
 * Common validation for remove operations
 */
export function validateRemoveOperation(
  rowsOrColumns: number,
  minRequired: number,
  direction: "row" | "column"
): boolean {
  if (rowsOrColumns <= minRequired) {
    const messageText = direction === "row" ? "至少保留二行" : "至少保留2列";
    message.error(messageText);
    return false;
  }
  return true;
}
