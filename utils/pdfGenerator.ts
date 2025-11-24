

declare const window: any;

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
  logoUrl?: string;
  campusName?: string;
  userName?: string;
  userInfo?: string[]; // Array of strings like ["ID: 123", "Carrera: Sistemas"]
  orientation?: 'p' | 'l'; // Portrait or Landscape
}

export const generateProfessionalPDF = (
  options: PDFOptions,
  headers: string[],
  data: any[][]
) => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Librería PDF cargando... intente en unos segundos.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: options.orientation || 'p' });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let currentY = 15;

  // --- HEADER ---
  
  // 1. Logo
  if (options.logoUrl) {
    try {
      // Intentamos añadir la imagen.
      doc.addImage(options.logoUrl, 'JPEG', margin, 10, 25, 25);
    } catch (e) {
      console.warn("No se pudo cargar el logo en el PDF (posible bloqueo CORS o formato inválido)");
    }
  }

  // 2. Institution Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(options.campusName || "UniSystem Pro", options.logoUrl ? 45 : margin, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Sistema Integrado de Gestión Académica", options.logoUrl ? 45 : margin, 26);
  doc.text("Departamento de Registro y Control", options.logoUrl ? 45 : margin, 31);

  // 3. Report Title & Date
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(options.title.toUpperCase(), pageWidth - margin, 20, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, pageWidth - margin, 26, { align: 'right' });
  if(options.subtitle) {
      doc.text(options.subtitle, pageWidth - margin, 31, { align: 'right' });
  }

  // Separator Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageWidth - margin, 40);

  currentY = 50;

  // 4. User Info Section (if present)
  if (options.userName || (options.userInfo && options.userInfo.length > 0)) {
      doc.setFillColor(243, 244, 246); // Gray-100
      doc.roundedRect(margin, currentY, pageWidth - (margin*2), 25, 3, 3, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      if(options.userName) doc.text(options.userName, margin + 5, currentY + 10);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50);
      
      if (options.userInfo) {
          let xOffset = margin + 5;
          let yOffset = currentY + 18;
          options.userInfo.forEach((info, index) => {
              doc.text(info, xOffset, yOffset);
              xOffset += 60; // Simple spacing column
              if (index === 2) { // Wrap line if needed
                  xOffset = margin + 5;
                  yOffset += 5;
              }
          });
      }
      currentY += 35;
  }

  // --- TABLE ---
  // Ensure we are calling autoTable correctly on the instance
  if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [headers],
        body: data,
        startY: currentY,
        theme: 'grid',
        styles: { 
            fontSize: 9, 
            cellPadding: 3,
            lineColor: [229, 231, 235], // Gray-200
            lineWidth: 0.1,
            textColor: [55, 65, 81] // Gray-700
        },
        headStyles: { 
            fillColor: [30, 58, 138], // Corporate Blue
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        alternateRowStyles: { 
            fillColor: [249, 250, 251] // Gray-50
        },
        columnStyles: {
            0: { fontStyle: 'bold' } // First column bold usually looks good
        }
      });
  } else {
      console.error("AutoTable plugin not found");
      doc.text("Error: Tabla no pudo ser generada.", margin, currentY);
  }

  // --- FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer Line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      
      // Left Footer
      doc.text('Documento oficial generado por UniSystem Pro.', margin, pageHeight - 10);
      doc.text('Válido sin enmiendas ni tachaduras.', margin, pageHeight - 6);
      
      // Right Footer (Page Num)
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.save(options.filename);
};