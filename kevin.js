const jsforce = require('jsforce');
const fs = require('fs');
const csv = require('fast-csv');

// Create a connection to Salesforce
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com'
});

// Salesforce credentials
const username = 'arvoailtd@pboedition.com';
const password = '1234BurgeriKHP9ebmEFZiQsLy5dsFYwYMO'; // Include the security token

const blacklist = [
    'ContentVersion', // Add other Content* objects as needed
    'DataStatistics', // Add specific objects causing EXTERNAL_OBJECT_UNSUPPORTED_EXCEPTION
    // Add any other object names that you encounter issues with
  ];
  
  async function queryAndExportAllRecords() {
    try {
      // Login to Salesforce
      await conn.login(username, password);
      console.log('Connected to Salesforce');
  
      // Describe global to get all sObjects and filter out non-queryable and blacklisted objects
      const globalDescribe = await conn.describeGlobal();
      const sObjects = globalDescribe.sobjects
        .filter(obj => obj.queryable && !blacklist.includes(obj.name))
        .map(obj => obj.name);
  
      for (const sObjectName of sObjects) {
        console.log(`Querying records for: ${sObjectName}`);
  
        // Dynamically describe sObject to get all field names
        const objectDescribe = await conn.sobject(sObjectName).describe();
        const fieldNames = objectDescribe.fields.map(field => field.name).join(', ');
  
        // Attempt SOQL query to retrieve all fields for records
        try {
          const query = `SELECT ${fieldNames} FROM ${sObjectName}`;
          const records = await conn.query(query);
  
          // Prepare CSV file for object records
          const writableStream = fs.createWriteStream(`records_${sObjectName}.csv`);
          const csvStream = csv.format({ headers: true });
          csvStream.pipe(writableStream);
  
          // Write each record to CSV
          records.records.forEach(record => {
            // Flatten record for CSV output
            const flattenedRecord = {};
            objectDescribe.fields.forEach(field => {
              flattenedRecord[field.name] = record[field.name];
            });
            csvStream.write(flattenedRecord);
          });
  
          // Close the CSV stream
          csvStream.end();
          console.log(`Records for ${sObjectName} have been written to CSV.`);
        } catch (queryError) {
          console.error(`Failed to query ${sObjectName}:`, queryError);
        }
      }
    } catch (error) {
      console.error('Error connecting to Salesforce:', error);
    }
  }
  
  // Run the function
  queryAndExportAllRecords();