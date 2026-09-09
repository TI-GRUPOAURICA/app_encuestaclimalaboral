export async function buscarDNI(dni) {
  const token = import.meta.env.VITE_API_PERU_TOKEN;
  if (!token) {
    alert("Falta configurar VITE_API_PERU_TOKEN en el archivo .env");
    return null;
  }
  
  try {
    const response = await fetch(`https://apiperu.dev/api/dni/${dni}?api_token=${token}`);
    const data = await response.json();
    if (data.success) {
      return data.data; // { numero, nombre_completo, nombres, apellido_paterno, apellido_materno }
    } else {
      alert("DNI no encontrado o error en API: " + data.message);
      return null;
    }
  } catch (error) {
    console.error("Error consultando API Peru:", error);
    alert("Error de conexión al buscar DNI.");
    return null;
  }
}

export async function buscarRUC(ruc) {
  const token = import.meta.env.VITE_API_PERU_TOKEN;
  if (!token) {
    alert("Falta configurar VITE_API_PERU_TOKEN en el archivo .env");
    return null;
  }
  
  try {
    const response = await fetch(`https://apiperu.dev/api/ruc/${ruc}?api_token=${token}`);
    const data = await response.json();
    if (data.success) {
      return data.data; // { ruc, nombre_o_razon_social, estado, condicion, direccion }
    } else {
      alert("RUC no encontrado o error en API: " + data.message);
      return null;
    }
  } catch (error) {
    console.error("Error consultando API Peru:", error);
    alert("Error de conexión al buscar RUC.");
    return null;
  }
}
