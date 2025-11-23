const { Pool } = require('pg');

exports.handler = async function(event, context) {
  // Configura CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Validar que sea POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
      };
    }

    // Conexión a Neon
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Aquí tu lógica de backup
    const data = JSON.parse(event.body);
    
    // Ejemplo: Insertar datos
    const result = await pool.query(
      'INSERT INTO tu_tabla (datos) VALUES ($1) RETURNING *',
      [JSON.stringify(data)]
    );

    await pool.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Backup completado',
        inserted: result.rows[0] 
      })
    };

  } catch (error) {
    console.error('Error en backup:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      })
    };
  }
};
