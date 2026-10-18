import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

export async function exportInvoiceHtmlPdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  // Capture invoice at high resolution with optimal desktop A4 print width
  const canvas = await html2canvas(element, {
    scale: 2.5, // Crisp high-DPI rendering
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(element.id);
      if (clonedEl) {
        // Enforce wide A4-proportional width so content doesn't squeeze or wrap unnecessarily
        clonedEl.style.width = "830px";
        clonedEl.style.maxWidth = "830px";
        clonedEl.style.minWidth = "830px";
        clonedEl.style.boxSizing = "border-box";
        clonedEl.style.padding = "24px 28px";
        clonedEl.style.margin = "0";
        clonedEl.style.borderRadius = "0";
        clonedEl.style.border = "none";
        clonedEl.style.boxShadow = "none";
        clonedEl.style.backgroundColor = "#ffffff";

        // Ensure signatures block is visible in the captured PDF
        const signatures = clonedEl.querySelector("[data-invoice-signatures]");
        if (signatures) {
          signatures.classList.remove("hidden");
          signatures.classList.add("grid");
        }
      }
    },
  });

  const imgData = canvas.toDataURL("image/png");

  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 6;
  const maxAvailableWidth = pageWidth - marginX * 2; // 198mm wide
  const maxAvailableHeight = pageHeight - 12; // 285mm tall

  // Calculate scaled height based on 198mm target width
  const imgWidth = maxAvailableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= maxAvailableHeight) {
    // Fits nicely on 1 page with comfortable top margin
    const topMargin = Math.max(6, (pageHeight - imgHeight) / 2 > 10 ? 8 : (pageHeight - imgHeight) / 2);
    pdf.addImage(imgData, "PNG", marginX, topMargin, imgWidth, imgHeight);
  } else {
    // If invoice is very long, scale slightly to ensure it stays on 1 page
    const scale = maxAvailableHeight / imgHeight;
    const finalWidth = imgWidth * scale;
    const finalHeight = maxAvailableHeight;
    const offsetX = (pageWidth - finalWidth) / 2;
    pdf.addImage(imgData, "PNG", offsetX, 6, finalWidth, finalHeight);
  }

  const finalName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  pdf.save(finalName);
}
