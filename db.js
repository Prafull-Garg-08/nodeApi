const { Client } = require('pg');
const { DefaultAzureCredential, ManagedIdentityCredential } = require('@azure/identity');

// Function to get the token using DefaultAzureCredential
async function getToken() {
  let credential;
  // if (process.env.ENV === 'prod') {
  //     console.log("local")
    const userAssignedManagedIdentity = "f5a4064f-9a32-48f4-9287-60be9f85679b"
    credential = new ManagedIdentityCredential(userAssignedManagedIdentity);
  // } else {
  //     console.log("local")
  //     credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
  return tokenResponse.token;
}
// Function to create a new PostgreSQL client
async function createClient() {
  const token = await getToken();

  const client = new Client({
    user: 'application', // Your PostgreSQL user
    host: 'wifi-db.postgres.database.azure.com',
    database: 'mydb',
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
    const results = await client.query('SELECT * FROM users');
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
    response.status(201).send(`User added `);
  } catch (error) {
    response.status(500).send(error.message);
  } finally {
    client.end(); // Close the client connection
  }
};

module.exports = {
  getUsers,
  createUser,
  createTable,
};
 