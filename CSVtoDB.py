import duckdb
import os
import glob

print("helloworld")

# Correctly expand the path to handle the '~'
csv_dir_path = os.path.expanduser('~/Desktop/arvo/Salesforce-export-metadata')
db_file_path = os.path.expanduser('~/Desktop/arvo/Salesforce-export-metadata/test2')

# Connect to DuckDB
conn = duckdb.connect(database=db_file_path, read_only=False)

# Get a list of all CSV files in the directory
csv_files = glob.glob(os.path.join(csv_dir_path, '*.csv'))

for csv_file in csv_files:

    # Skip the Discard.csv file
    if 'Discard.csv' in csv_file:
        print(f"Skipping {csv_file}.")
        continue
    # Extract the base name without the '.csv' extension to use as the table name
    table_name = os.path.splitext(os.path.basename(csv_file))[0]
    
    # Check if the table already exists
    table_list = conn.execute("SHOW TABLES").fetchall()
    if table_name in [table[0] for table in table_list]:
        # If the table exists, delete existing data (or drop the table) and recreate it
        print(f"Table {table_name} exists. Updating table with new data.")
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{csv_file}')")
    else:
        # If the table does not exist, create it as before
        print(f"Creating table {table_name}.")
        conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{csv_file}')")

query = f"SELECT * FROM records_Account"
result_df = conn.execute(query).fetchdf()
print(result_df)
# Close the connection
conn.close()
