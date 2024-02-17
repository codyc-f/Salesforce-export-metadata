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

async function queryAndExportAllRecords() {
  try {
    // Login to Salesforce
    await conn.login(username, password);
    console.log('Connected to Salesforce');

    const globalDescribe = await conn.describeGlobal();
    // Only filtering on queryable objects, not fields
    const sObjects = globalDescribe.sobjects.filter(obj => obj.queryable).map(obj => obj.name);

    for (const sObjectName of sObjects) {
      try {
        console.log(`Processing: ${sObjectName}`);

        // Fetch a minimal set of standard fields for each object
        // This is a simplified approach, you might want to adjust based on your needs
        let fieldsToQuery = ['Id', 'Name'];
        const objectDescribe = await conn.sobject(sObjectName).describe();
        const fieldNames = objectDescribe.fields.map(field => field.name);
        
        // Check if standard fields exist in the object, adjust the fields to query accordingly
        fieldsToQuery = fieldsToQuery.filter(field => fieldNames.includes(field));
        if (fieldsToQuery.length === 0) {
          // If no standard 'Id' or 'Name' fields are available, take the first two queryable fields as a fallback
          fieldsToQuery = objectDescribe.fields.filter(field => field.queryable).slice(0, 2).map(field => field.name);
        }

        // If after filtering there are no fields to query, skip the object
        if (fieldsToQuery.length === 0) {
          console.log(`Skipping ${sObjectName}: No queryable fields available.`);
          continue;
        }

        const query = `SELECT ${fieldsToQuery.join(', ')} FROM ${sObjectName} LIMIT 100`;
        const records = await conn.query(query);

        // Setup CSV stream
        const writableStream = fs.createWriteStream(`records_${sObjectName}.csv`);
        const csvStream = csv.format({ headers: true });
        csvStream.pipe(writableStream);

        // Write records to CSV
        records.records.forEach(record => {
          const flattenedRecord = {};
          fieldsToQuery.forEach(fieldName => {
            flattenedRecord[fieldName] = record[fieldName];
          });
          csvStream.write(flattenedRecord);
        });

        csvStream.end(() => console.log(`Exported ${sObjectName} to CSV.`));
      } catch (error) {
        console.error(`Error querying ${sObjectName}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error during connection or global describe:', error);
  }
}

queryAndExportAllRecords();
