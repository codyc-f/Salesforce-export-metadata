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

    // Read the Discard.csv file to get a list of sObjects to ignore
    const discardStream = fs.createReadStream('Discard.csv');
    const discardedSObjects = await new Promise((resolve, reject) => {
      let sObjects = [];
      csv.parseStream(discardStream, { headers: true })
        .on('data', row => {
          sObjects.push(row.sObjectName); // Assuming the column name is sObjectName
        })
        .on('end', () => resolve(sObjects))
        .on('error', reject);
    });

    // Describe global to get all sObjects and filter out non-queryable, blacklisted, and discarded objects
    const globalDescribe = await conn.describeGlobal();
    const sObjects = globalDescribe.sobjects
      .filter(obj => obj.queryable)
      .filter(obj => !discardedSObjects.includes(obj.name)) // Exclude discarded sObjects
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
