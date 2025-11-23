// netlify/functions/backup-data.js
const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Parsear datos del request
    const requestData = JSON.parse(event.body);
    const { users, attendance, income, lastBackup } = requestData;

    // Validar datos mínimos
    if (!users || !attendance || !income) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Datos incompletos' })
      };
    }

    // Crear pool de conexión a Neon
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Preparar datos para guardar
    const backupData = {
      users,
      attendance,
      income,
      lastBackup: lastBackup || new Date().toISOString(),
      backupTimestamp: new Date().toISOString(),
      totalRecords: {
        users: users.length,
        attendance: attendance.length,
        income: income.length
      }
    };

    // Insertar en la base de datos
    const result = await pool.query(
      'INSERT INTO antologia_backups (backup_data, backup_type) VALUES ($1, $2) RETURNING id, created_at',
      [backupData, 'automatic']
    );

    // Cerrar conexión
    await pool.end();

    // Respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Respaldo guardado exitosamente',
        backupId: result.rows[0].id,
        createdAt: result.rows[0].created_at,
        records: backupData.totalRecords
      })
    };

  } catch (error) {
    console.error('Error en backup:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};
