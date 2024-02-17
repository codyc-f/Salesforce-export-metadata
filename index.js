const jsforce = require('jsforce');
const { DuckDB } = require('duckdb');

// Create a connection to Salesforce
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com'
});

// Salesforce credentials
const username = 'arvoailtd@pboedition.com';
const password = 'yourpassword'; // Include the security token

// Create a new DuckDB instance and connection
const db = new DuckDB();
const dbConnection = db.connect();

async function queryAndExportAllRecordsToDuckDB() {
  try {
    // Login to Salesforce
    await conn.login(username, password);
    console.log('Connected to Salesforce');

    // Describe global to get all sObjects
    const globalDescribe = await conn.describeGlobal();
    const sObjects = globalDescribe.sobjects.filter(obj => obj.queryable).map(obj => obj.name);

    for (const sObjectName of sObjects) {
      console.log(`Querying records for: ${sObjectName}`);

      // Dynamically describe sObject to get all field names
      const objectDescribe = await conn.sobject(sObjectName).describe();
      const fieldNames = objectDescribe.fields.map(field => field.name).join(', ');

      // Attempt SOQL query to retrieve all fields for records
      try {
        const query = `SELECT ${fieldNames} FROM ${sObjectName}`;
        const records = await conn.query(query);

        // Create table in DuckDB if not exists and prepare insert statement
        const createTableQuery = generateCreateTableQuery(sObjectName, objectDescribe.fields);
        await dbConnection.execute(createTableQuery);

        // Prepare insert statement
        const insertQuery = `INSERT INTO ${sObjectName} VALUES ?`;
        
        // Map records for insertion
        const recordsToInsert = records.records.map(record => {
          return objectDescribe.fields.map(field => record[field.name]);
        });

        // Insert records into DuckDB
        if (recordsToInsert.length > 0) {
          await dbConnection.execute(insertQuery, [recordsToInsert]);
        }

        console.log(`Records for ${sObjectName} have been inserted into DuckDB.`);
      } catch (queryError) {
        console.error(`Failed to query ${sObjectName}:`, queryError);
      }
    }
  } catch (error) {
    console.error('Error connecting to Salesforce:', error);
  } finally {
    // Close DuckDB connection
    dbConnection.close();
    db.close();
  }
}

// Helper function to generate SQL CREATE TABLE query based on Salesforce object fields
function generateCreateTableQuery(tableName, fields) {
  const fieldDefinitions = fields.map(field => `${field.name} VARCHAR`).join(', ');
  return `CREATE TABLE IF NOT EXISTS ${tableName} (${fieldDefinitions})`;
}

// Run the function
queryAndExportAllRecordsToDuckDB();
