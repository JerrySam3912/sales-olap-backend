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

CLEAN_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'cleaned'))

# Load order must respect FK constraints (dimensions before facts)
TABLE_ORDER = [
    'dim_date',
    'dim_territory',
    'dim_customer',
    'dim_product_category',
    'dim_product_subcategory',
    'dim_product',
    'fact_sales',
    'fact_returns'
]

# Map table name → CSV file name when they differ
FILE_MAP = {
    'fact_returns': 'fact_return'
}

# Column renames for pass-through CSVs that still have PascalCase headers
COLUMN_RENAMES = {
    'dim_territory': {
        'SalesTerritoryKey': 'territory_key',
        'Region': 'region',
        'Country': 'country',
        'Continent': 'continent'
    },
    'dim_product_category': {
        'ProductCategoryKey': 'product_category_key',
        'CategoryName': 'category_name'
    },
    'dim_product_subcategory': {
        'ProductSubcategoryKey': 'product_subcategory_key',
        'SubcategoryName': 'subcategory_name',
        'ProductCategoryKey': 'product_category_key'
    },
    'fact_returns': {
        'ReturnDate': 'return_date',
        'TerritoryKey': 'territory_key',
        'ProductKey': 'product_key',
        'ReturnQuantity': 'return_quantity'
    }
}

def load_data_to_mysql():
    print(f"Connecting to MySQL: {DB_NAME}...")

    for table_name in TABLE_ORDER:
        file_name = FILE_MAP.get(table_name, table_name)
        file_path = os.path.join(CLEAN_DATA_PATH, f"{file_name}.csv")

        if not os.path.exists(file_path):
            print(f"WARNING: {file_path} not found, skipping.")
            continue

        print(f"Reading {file_name}.csv...")
        df = pd.read_csv(file_path)

        if table_name in COLUMN_RENAMES:
            df = df.rename(columns=COLUMN_RENAMES[table_name])
            print(f" -> Renamed columns: {list(COLUMN_RENAMES[table_name].keys())}")

        print(f" -> Inserting {len(df)} rows into `{table_name}`...")
        try:
            df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
            print(f" -> SUCCESS: {table_name} loaded.\n")
        except Exception as e:
            print(f" -> ERROR loading {table_name}: {e}\n")

    print("DATABASE LOAD COMPLETE!")

if __name__ == "__main__":
    load_data_to_mysql()
