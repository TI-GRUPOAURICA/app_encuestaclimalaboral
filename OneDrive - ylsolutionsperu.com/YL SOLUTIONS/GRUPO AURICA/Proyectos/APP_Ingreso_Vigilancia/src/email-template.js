export function getWelcomeEmailHtml(visitante) {
  const hostUrl = window.location.origin;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: Arial, sans-serif;
    color: #333333;
    margin: 0;
    padding: 0;
    background-color: #f9f9f9;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }
  .image-block {
    width: 100%;
    display: block;
    margin: 0;
    padding: 0;
    border: none;
  }
  .content {
    padding: 20px 40px;
  }
  .content p {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .summary-box {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }
  .summary-box h3 {
    color: #245187;
    margin-top: 0;
    font-size: 18px;
  }
  .summary-box p {
    margin: 5px 0;
    font-size: 15px;
  }
</style>
</head>
<body>
  <div class="container">
    <!-- IMAGEN 1: CABECERA (Logo, Manos, Título) -->
    <img src="${hostUrl}/correo-cabecera.jpg" alt="Bienvenidos a Grupo Aurica" class="image-block">
    
    <!-- TEXTO DINÁMICO HTML -->
    <div class="content">
      <p style="font-weight: bold; color: #000;">Hola ${visitante.nombres} ${visitante.ape_pat},</p>
      <p>Gracias por tu visita. Tu registro y acuerdo de confidencialidad han sido confirmados. En nuestro grupo empresarial consideramos que la seguridad y la confianza son pilares fundamentales en la relación con nuestros socios estratégicos, por lo que este acuerdo asegura una experiencia óptima en nuestras instalaciones.</p>
      
      <div class="summary-box">
        <h3 style="color: #245187; font-weight: bold;">Resumen de visita</h3>
        <p><strong>Visitante:</strong> ${visitante.nombres} ${visitante.ape_pat} ${visitante.ape_mat || ''}</p>
        <p><strong>DNI:</strong> ${visitante.dni}</p>
        <p><strong>Empresa:</strong> ${visitante.empresa || 'Independiente'}</p>
      </div>
    </div>

    <!-- IMAGEN 3: PIE (Footer azul) -->
    <img src="${hostUrl}/correo-pie.jpg" alt="Contacto" class="image-block">
  </div>
</body>
</html>
  `;
}
