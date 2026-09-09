import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateAcuerdoPDF(visitanteInfo, signatureDataUrl) {
  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();
  
  // Add a blank page (A4 size: 595.28 x 841.89)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  // Embed fonts
  // Nota: Para usar Nexa, necesitas cargar el archivo .ttf. 
  // Por ahora usaremos Helvetica (la más similar nativa).
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Colors
  const primaryBlue = rgb(36/255, 81/255, 135/255);
  const textDark = rgb(51/255, 51/255, 51/255);
  
  // 1. Draw Logos (Top Header)
  try {
    const logoAuricaBytes = await fetch('/logo.png').then(res => res.arrayBuffer());
    const logoAurica = await pdfDoc.embedPng(logoAuricaBytes);
    
    // Scale proportionally to fit within 150x60
    const scaleX = 150 / logoAurica.width;
    const scaleY = 60 / logoAurica.height;
    const finalScale = Math.min(scaleX, scaleY, 1);
    const logo1Dims = logoAurica.scale(finalScale);
    
    page.drawImage(logoAurica, {
      x: 40,
      y: height - 40 - logo1Dims.height, // 40px desde el borde superior
      width: logo1Dims.width,
      height: logo1Dims.height,
    });
  } catch (e) {
    console.warn("Logo de Aurica no encontrado", e);
  }

  try {
    let logosEmpresasBytes;
    try {
      const res1 = await fetch('/logos-empresa.png?v=' + Date.now());
      if (!res1.ok) throw new Error();
      logosEmpresasBytes = await res1.arrayBuffer();
    } catch (e1) {
      const res2 = await fetch('/logo-empresa.png?v=' + Date.now());
      if (!res2.ok) throw new Error();
      logosEmpresasBytes = await res2.arrayBuffer();
    }
    
    let logosEmpresas;
    try {
      logosEmpresas = await pdfDoc.embedPng(logosEmpresasBytes);
    } catch (errPng) {
      logosEmpresas = await pdfDoc.embedJpg(logosEmpresasBytes);
    }
    
    // Scale proportionally to fit within 250x60
    const scaleX2 = 250 / logosEmpresas.width;
    const scaleY2 = 60 / logosEmpresas.height;
    const finalScale2 = Math.min(scaleX2, scaleY2, 1);
    const logo2Dims = logosEmpresas.scale(finalScale2);
    
    page.drawImage(logosEmpresas, {
      x: width - logo2Dims.width - 40,
      y: height - 40 - logo2Dims.height, // 40px desde el borde superior
      width: logo2Dims.width,
      height: logo2Dims.height,
    });
  } catch (e) {
    console.warn("Logos secundarios no encontrados o formato inválido", e);
  }

  // 2. Title
  const titleText = 'ACUERDO DE CONFIDENCIALIDAD PARA VISITANTES';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 130, // Movido hacia abajo para no chocar con los logos
    size: 14,
    font: fontBold,
    color: primaryBlue,
  });

  // 3. Body Text (Structured line by line to prevent overlapping)
  let currentY = height - 170; // Movido hacia abajo proporcionalmente
  const lineHeight = 11;
  const paragraphSpacing = 8;
  
  const sections = [
    {
      title: '1. PARTES INVOLUCRADAS',
      text: 'El presente Acuerdo de Confidencialidad (el "Acuerdo") es celebrado entre el \nvisitante, cuyos datos se consignan lineas abajo (el "Visitante"), y las empresas \nMETALAB S.A.C., MINERALAB S.A.C. y AURICA S.A.C., integrantes del Grupo AURICA, en \nadelante denominadas en conjunto como "LA EMPRESA".'
    },
    {
      title: '2. OBJETO DEL ACUERDO',
      text: 'El presente Acuerdo tiene por objeto establecer las condiciones de confidencialidad y\nprotección de la información a la que el Visitante pudiera tener acceso, directa o \nindirectamente, durante su permanencia en las instalaciones de LA EMPRESA. Esta \nobligación comprende toda información técnica, operativa, comercial o estratégica, \nasí como materiales, procesos, productos, documentos, datos o cualquier otro \nelemento considerado sensible o confidencial por LA EMPRESA.'
    },
    {
      title: '3. CONFIDENCIALIDAD',
      text: 'El Visitante se obliga expresamente a:\n  • No divulgar, comunicar ni reproducir, por ningún medio físico o digital, información \n    obtenida durante su visita.\n  • No tomar fotografías, realizar grabaciones de audio o video, ni elaborar croquis o \n    anotaciones sin autorización expresa.\n  • No manipular ni acercarse a materiales, muestras o productos sin autorización \n    del personal designado.\n  • No utilizar dispositivos informáticos para intentar acceder a las redes o recursos \n    tecnológicos de LA EMPRESA.'
    },
    {
      title: '4. ALCANCE Y DURACIÓN',
      text: 'La obligación de confidencialidad entrará en vigencia desde la fecha de firma del \npresente Acuerdo y se mantendrá vigente por un periodo de cinco (5) años a partir \nde la fecha de la visita, independientemente de que se establezcan o no relaciones \ncontractuales o laborales entre el Visitante y LA EMPRESA.'
    },
    {
      title: '5. PROPIEDAD DE LA INFORMACIÓN',
      text: 'Toda la información observada, recibida o compartida durante la visita es de \npropiedad exclusiva de LA EMPRESA. El Visitante no adquiere ningún derecho sobre la \nmisma.'
    },
    {
      title: '6. RESPONSABILIDAD',
      text: 'El Visitante reconoce y acepta que cualquier incumplimiento de los términos de este \nAcuerdo podrá dar lugar a la imposición de sanciones legales, incluyendo las \nresponsabilidades civiles, penales y/o administrativas que correspondan conforme a \nla legislación vigente.'
    },
    {
      title: '7. JURISDICCIÓN Y LEY APLICABLE',
      text: 'Este Acuerdo se regirá por las leyes de la República del Perú. Toda controversia \nderivada de su interpretación o ejecución será resuelta por los tribunales \ncompetentes de Lima Metropolitana.'
    }
  ];

  sections.forEach(sec => {
    // Draw Title (Bold)
    page.drawText(sec.title, { x: 45, y: currentY, size: 9, font: fontBold, color: textDark });
    currentY -= lineHeight; // Move down for text
    
    // Draw Text (Normal)
    const lines = sec.text.split('\n');
    lines.forEach(line => {
      page.drawText(line, { x: 45, y: currentY, size: 9, font: font, color: textDark });
      currentY -= lineHeight;
    });
    
    currentY -= paragraphSpacing; // Extra space between paragraphs
  });

  // 4. Visitor Info Footer (Positioned right after the text to avoid overlap)
  currentY -= 10;
  
  const nombres = visitanteInfo.nombres || '';
  const apellidoPaterno = visitanteInfo.apellidos ? visitanteInfo.apellidos.split(' ')[0] : '';
  const apellidoMaterno = visitanteInfo.apellidos ? visitanteInfo.apellidos.split(' ').slice(1).join(' ') : '';
  const dni = visitanteInfo.dni || '';

  page.drawText(`Nombre: ${nombres}`, { x: 45, y: currentY, size: 9, font: font });
  currentY -= lineHeight;
  page.drawText(`Apellido Paterno: ${apellidoPaterno}`, { x: 45, y: currentY, size: 9, font: font });
  currentY -= lineHeight;
  page.drawText(`Apellido Materno: ${apellidoMaterno}`, { x: 45, y: currentY, size: 9, font: font });
  currentY -= lineHeight;
  page.drawText(`DNI: ${dni}`, { x: 45, y: currentY, size: 9, font: font });

  // 5. Embed Signature Image (Properly scaled and positioned)
  if (signatureDataUrl) {
    try {
      const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      
      // Calculate responsive dimensions (max width 100, max height 40)
      const scaleXSig = 100 / signatureImage.width;
      const scaleYSig = 40 / signatureImage.height;
      const finalScaleSig = Math.min(scaleXSig, scaleYSig, 1);
      const sigDims = signatureImage.scale(finalScaleSig);
      
      // En pdf-lib el Y = 0 es el FONDO de la hoja.
      // currentY es donde terminó el texto del DNI. Queremos la firma MÁS ABAJO, es decir, menor Y.
      // Así que restamos el alto de la firma + un margen.
      const finalSigY = currentY - 20 - sigDims.height;
      const sigX = (width - sigDims.width) / 2;
      
      page.drawImage(signatureImage, {
        x: sigX,
        y: finalSigY,
        width: sigDims.width,
        height: sigDims.height,
      });
      
      // La línea va justo debajo de la firma
      const sigLineY = finalSigY - 5;
      
      // Draw signature line
      page.drawLine({
        start: { x: width / 2 - 80, y: sigLineY },
        end: { x: width / 2 + 80, y: sigLineY },
        thickness: 1,
        color: textDark,
      });
      
      // Draw signature label
      const sigLabel = 'FIRMA DEL VISITANTE';
      const sigLabelWidth = fontBold.widthOfTextAtSize(sigLabel, 9);
      page.drawText(sigLabel, {
        x: (width - sigLabelWidth) / 2,
        y: sigLineY - 12,
        size: 9,
        font: fontBold,
        color: textDark,
      });
      
      // Draw date
      const dateStr = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
      const dateWidth = font.widthOfTextAtSize(dateStr, 9);
      page.drawText(dateStr, {
        x: (width - dateWidth) / 2,
        y: sigLineY - 24,
        size: 9,
        font: font,
        color: textDark,
      });
      
    } catch (e) {
      console.error("Failed to embed signature:", e);
    }
  }

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
