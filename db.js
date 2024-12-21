const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');

// Function to get the token using DefaultAzureCredential
async function getToken() {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
  return tokenResponse.token;
}

// Function to create a new PostgreSQL client
async function createClient() {
  const token = await getToken();

  const client = new Client({
    user: 'authid', // Your PostgreSQL user
    host: 'authprivate.postgres.database.azure.com',
    database: 'postgres',
    password: token, // Use the token as the password
    port: 5432,
    ssl: true, // Ensure SSL is enabled when connecting to Azure Database
  });

  // Connect to the database
  await client.connect();
  return client;
}

// Function to create the 'users' table if it does not exist
const createTable = async (request, response) => {
    const client = await createClient();
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE
        );
      `;
      await client.query(createTableQuery);
      response.status(200).send("Table 'users' created (if not already exists).");
    } catch (error) {
      response.status(500).send(error.message);
    } finally {
      client.end(); // Close the client connection
    }
  };

  
// Get all users
const getUsers = async (request, response) => {
  const client = await createClient();
  try {
    const results = await client.query('SELECT * FROM users ORDER BY id ASC');
    response.status(200).json(results.rows);
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

// Get user by ID
const getUserById = async (request, response) => {
  const id = parseInt(request.params.id);
  const client = await createClient();
  try {
    const results = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    response.status(200).json(results.rows);
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

// Create a new user
const createUser = async (request, response) => {
  const { name, email } = request.body;
  const client = await createClient();
  try {
    const results = await client.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    response.status(201).send(`User added with ID: ${results.rows[0].id}`);
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

// Update an existing user
const updateUser = async (request, response) => {
  const id = parseInt(request.params.id);
  const { name, email } = request.body;
  const client = await createClient();
  try {
    const results = await client.query('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *', [name, email, id]);
    if (results.rows.length === 0) {
      response.status(404).send(`User not found`);
    } else {
      response.status(200).send(`User modified with ID: ${results.rows[0].id}`);
    }
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

// Delete a user
const deleteUser = async (request, response) => {
  const id = parseInt(request.params.id);
  const client = await createClient();
  try {
    const results = await client.query('DELETE FROM users WHERE id = $1', [id]);
    if (results.rowCount === 0) {
      response.status(404).send(`User not found`);
    } else {
      response.status(200).send(`User deleted with ID: ${id}`);
    }
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createTable,
};
