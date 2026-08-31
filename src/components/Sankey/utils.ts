import { SankeyNode } from "./SankeyChartD3";
import { formatCompactCurrency } from "@/lib/format-compact-currency";

export const formatNumber = (amount: number, scalingFactor = 1e9) => {
  const scaledAmount = Number(amount * scalingFactor);

  return formatCompactCurrency(scaledAmount, {
    locale: "en-US",
    currency: "USD",
    maximumFractionDigits:
      Math.abs(scaledAmount) >= 1e9 ? 2 : Math.abs(scaledAmount) >= 1e6 ? 1 : 0,
  });
};

// Generate a unique ID from a name string
export function generateId(name: string, parentId?: string): string {
  // Clean the name: remove special characters, convert to lowercase, replace spaces with underscores
  const cleanName = (name || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-+/g, "_") // Replace hyphens with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

  // If we have a parent ID, combine them
  if (parentId) {
    return `${parentId}_${cleanName}`;
  }

  return cleanName;
}

// Extract display name from full hierarchical name
export function extractDisplayName(fullName: string): string {
  if (!fullName) return "Unknown";
  // Split by arrow (→) and take the last part
  const parts = fullName.split(" → ");
  return parts[parts.length - 1].trim();
}

// Merge duplicate children in a node that have the same display name
export function mergeDuplicateChildren(node: any): any {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  // Group children by display name
  const displayNameGroups: { [key: string]: any[] } = {};

  node.children.forEach((child: any) => {
    const displayName = extractDisplayName(child.name);
    if (!displayNameGroups[displayName]) {
      displayNameGroups[displayName] = [];
    }
    displayNameGroups[displayName].push(child);
  });

  // Merge duplicates and create new children array
  const mergedChildren: any[] = [];

  Object.entries(displayNameGroups)
    .map((group) => group[1])
    .forEach((children) => {
      if (children.length === 1) {
        // No duplicates, recursively process child
        mergedChildren.push(mergeDuplicateChildren(children[0]));
      } else {
        // Merge duplicates
        const totalAmount = children.reduce(
          (sum, child) => sum + (child.amount || 0),
          0,
        );

        // Merge all children's children
        const allChildrenChildren: any[] = [];
        children.forEach((child) => {
          if (child.children) {
            allChildrenChildren.push(...child.children);
          }
        });

        // Create merged node
        let merged: any = {
          name: children[0].name, // Use the first one's name as base
          amount: totalAmount,
        };

        if (allChildrenChildren.length > 0) {
          merged.children = allChildrenChildren;
          // Recursively process the merged children
          merged = mergeDuplicateChildren(merged);
        }

        mergedChildren.push(merged);
      }
    });

  return {
    ...node,
    children: mergedChildren,
  };
}

// Transform legacy data structure to use id/displayName and merge duplicates
export function transformToIdBased(
  node: any,
  parentId?: string,
  usedIds = new Set<string>(),
): SankeyNode {
  // First merge duplicates, then transform to ID-based
  const mergedNode = mergeDuplicateChildren(node);

  // Handle case where node already has id and displayName
  if (mergedNode.id && mergedNode.displayName) {
    const transformed: SankeyNode = {
      id: mergedNode.id,
      displayName: mergedNode.displayName,
      amount: mergedNode.amount,
    };

    if (mergedNode.children) {
      transformed.children = mergedNode.children.map((child: any) =>
        transformToIdBased(child, mergedNode.id, usedIds),
      );
    }

    return transformed;
  }

  // Extract display name from full name
  const displayName = mergedNode.name
    ? extractDisplayName(mergedNode.name)
    : "Unknown";

  // Generate base ID
  const baseId = generateId(displayName, parentId);

  // Ensure uniqueness by adding counter if needed
  let finalId = baseId;
  let counter = 1;
  while (usedIds.has(finalId)) {
    finalId = `${baseId}_${counter}`;
    counter++;
  }
  usedIds.add(finalId);

  const transformed: SankeyNode = {
    id: finalId,
    displayName,
    name: mergedNode.name, // Keep for backward compatibility
    amount: mergedNode.amount,
  };

  if (mergedNode.children) {
    transformed.children = mergedNode.children.map((child: any) =>
      transformToIdBased(child, finalId, usedIds),
    );
  }

  return transformed;
}

export function sortNodesByAmount(node: SankeyNode): SankeyNode {
  // If the node has children, sort them
  if (node.children && node.children.length > 0) {
    // First recursively sort each child's children (if any)
    node.children.forEach((child) => sortNodesByAmount(child));

    // Then sort the children array by amount (descending)
    node.children.sort((a, b) => {
      // Calculate the amount for nodes that have children (sum of their children's amounts)
      const getAmount = (node: SankeyNode): number => {
        if (node.amount !== undefined) return node.amount;
        if (!node.children) return 0;
        return node.children.reduce((sum, child) => sum + getAmount(child), 0);
      };

      return getAmount(b) - getAmount(a); // Descending order
    });
  }

  return node;
}
