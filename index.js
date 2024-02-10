const jsforce = require('jsforce');

// Create a connection to Salesforce
// If connecting to a production environment, use the login URL 'https://login.salesforce.com'
// If connecting to a sandbox environment, use 'https://test.salesforce.com'
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com' // or 'https://test.salesforce.com' for sandbox
});

// Replace with your Salesforce login credentials
const username = 'arvoailtd@pboedition.com';
const password = '1234BurgeriKHP9ebmEFZiQsLy5dsFYwYMO'; // Password should include the security token appended at the end if required

// Log in to Salesforce using JSforce
conn.login(username, password, function(err, userInfo) {
  if (err) {
    // Error handling
    console.error("Error while connecting to Salesforce:", err);
  } else {
    // Connection was successful
    console.log("Connected to Salesforce as user:", userInfo.id);

    // Perform operations after successful connection
    // For example, querying records:
    conn.query('SELECT Id, First_Name__c, gender__c FROM testData__c LIMIT 300', function(err, result) {
      if (err) {
        return console.error(err);
      }
      console.log("Total records: " + result.totalSize);
      console.log("Fetched records: " + result.records.length);
      // Work with the queried records here
      result.records.forEach((record) => {
        console.log(record.gender__c + "," + record.First_Name__c);
      });
    });

    // Other operations like creating, updating, deleting records can also be performed
  }
});
