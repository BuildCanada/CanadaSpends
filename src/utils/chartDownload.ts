import html2canvas from "html2canvas";

/**
 * Downloads a chart element as PNG image
 */
export async function downloadChartAsPNG(
  element: HTMLElement,
  filename: string = "chart",
): Promise<void> {
  try {
    console.log("Starting chart download for element:", element);
    console.log(
      "Element dimensions:",
      element.offsetWidth,
      "x",
      element.offsetHeight,
    );

    // Wait a bit for any animations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create canvas from the chart element with optimized settings for Recharts
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 1, // Reduced scale to avoid memory issues
      useCORS: true,
      allowTaint: false,
      logging: false, // Disable logging to avoid color parsing spam
      foreignObjectRendering: false, // Disable to avoid modern CSS issues
      ignoreElements: (element) => {
        // Skip elements that might have problematic CSS
        return element.tagName === "STYLE" || element.tagName === "SCRIPT";
      },
      onclone: (clonedDoc) => {
        // Remove problematic CSS that uses modern color functions
        const styles = clonedDoc.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent) {
            // Replace oklch and other modern color functions with fallbacks
            style.textContent = style.textContent
              .replace(/oklch\([^)]+\)/g, "rgb(59, 130, 246)") // Default blue
              .replace(/color-mix\([^)]+\)/g, "rgb(59, 130, 246)")
              .replace(/lch\([^)]+\)/g, "rgb(59, 130, 246)")
              .replace(/lab\([^)]+\)/g, "rgb(59, 130, 246)");
          }
        });

        // Also handle inline styles
        const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
        elementsWithStyle.forEach((el) => {
          const style = el.getAttribute("style");
          if (
            style &&
            (style.includes("oklch") || style.includes("color-mix"))
          ) {
            el.setAttribute(
              "style",
              style
                .replace(/oklch\([^)]+\)/g, "rgb(59, 130, 246)")
                .replace(/color-mix\([^)]+\)/g, "rgb(59, 130, 246)"),
            );
          }
        });
      },
      height: element.offsetHeight,
      width: element.offsetWidth,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    console.log(
      "Canvas created successfully:",
      canvas.width,
      "x",
      canvas.height,
    );

    // Convert canvas to blob with Promise wrapper
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          resolve(blob);
        },
        "image/png",
        1.0,
      );
    });

    console.log("Blob created successfully, size:", blob.size);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.png`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    console.log("Download completed successfully");
  } catch (error) {
    console.error("Detailed error downloading chart:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack available",
    );
    throw new Error(
      `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Alternative download method with simpler approach
 */
export async function downloadChartAsPNGSimple(
  element: HTMLElement,
  filename: string = "chart",
): Promise<void> {
  try {
    console.log("Using simple download approach...");

    // Create canvas with minimal options and color fix
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      useCORS: true,
      scale: 1,
      logging: false,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        // Quick fix for oklch colors
        const styles = clonedDoc.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent && style.textContent.includes("oklch")) {
            style.textContent = style.textContent.replace(
              /oklch\([^)]+\)/g,
              "rgb(59, 130, 246)",
            );
          }
        });
      },
    });

    // Direct download approach
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("Simple download completed");
  } catch (error) {
    console.error("Simple download failed:", error);
    throw error;
  }
}

/**
 * Sanitizes a filename by removing invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\-_\s]/gi, "") // Remove invalid characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase()
    .slice(0, 50); // Limit length
}
