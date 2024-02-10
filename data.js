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

// Async function to describe and retrieve metadata
async function describeAndRetrieveMetadata() {
  try {
    // Login to Salesforce
    await conn.login(username, password);
    console.log('Connected to Salesforce');

    // Describe metadata to get the types
    const metadataDescription = await conn.metadata.describe('52.0');
    
    // Iterate over each metadata type and list items
    for (const metadataType of metadataDescription.metadataObjects) {
      const type = metadataType.xmlName;
      console.log(`Retrieving metadata for type: ${type}`);

      // List metadata of the current type
      const metadataListResult = await conn.metadata.list([{ type: type, folder: null }], '52.0');
      
      // Ensure the result is an array
      const metadataList = Array.isArray(metadataListResult) ? metadataListResult.filter(Boolean) : [metadataListResult].filter(Boolean);

      // Write metadata to CSV file
      const writableStream = fs.createWriteStream(`metadata_${type}.csv`);
      const csvStream = csv.format({ headers: true });
      
      csvStream.pipe(writableStream).on('end', () => process.exit());

      metadataList.forEach(md => {
        // Write the fields you are interested in
        csvStream.write({
          fullName: md.fullName,
          type: md.type,
          // ... add other fields as necessary
        });
      });

      csvStream.end();
      console.log(`Metadata for type: ${type} has been written to CSV.`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function to describe and retrieve metadata
describeAndRetrieveMetadata();
