import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv



BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '.env'))

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

if not all([DB_USER, DB_PASS, DB_HOST, DB_NAME]):
    raise ValueError("Missing one or more database credentials. Check your .env file.")

connection_string = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
engine = create_engine(connection_string)

# Paths
CLEAN_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'cleaned'))

TABLE_ORDER = [
    'dim_calendar',
    'dim_territory',
    'dim_customer',
    'dim_product_category',
    'dim_product_subcategory',
    'dim_product',
    'fact_sales',
    'fact_return'
]

def load_data_to_mysql():
    print(f"Connecting to MySQL Database: {DB_NAME}...")

    for table_name in TABLE_ORDER:
        file_path = os.path.join(CLEAN_DATA_PATH, f"{table_name}.csv")

        if os.path.exists(file_path):
            print(f"Reading {table_name}.csv...")
            df = pd.read_csv(file_path)

            print(f" -> Inserting {len(df)} rows into `{table_name}` table...")

            try:
                df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
                print(f" -> SUCCESS: {table_name} loaded.\n")
            except Exception as e:
                print(f" -> ERROR loading {table_name}: {e}\n")
        else:
            print(f"WARNING: Could not find {file_path}")

    print("DATABASE LOAD COMPLETE!")

if __name__ == "__main__":
    load_data_to_mysql()