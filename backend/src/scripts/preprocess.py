import pandas as pd
import numpy as np
import os
import glob
import re

# 1. PATH CONFIGURATION

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW_DATA_PATH = os.path.join(BASE_DIR, 'data', 'raw')
CLEAN_DATA_PATH = os.path.join(BASE_DIR, 'data', 'cleaned')
os.makedirs(CLEAN_DATA_PATH, exist_ok=True)

# 2. FILE LOADING FUNCTION
def load_data():
    print(f"Loading raw datasets from: {RAW_DATA_PATH}")
    csv_files = glob.glob(os.path.join(RAW_DATA_PATH, '*.csv'))
    dfs = {}
    
    for file_path in csv_files:
        if 'cleaned' in file_path:
            continue
            
        filename = os.path.basename(file_path)
        raw_name = os.path.splitext(filename)[0]
        clean_name = re.sub(r'[^a-zA-Z0-9]', '_', raw_name).lower()
        
        try:
            dfs[clean_name] = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            dfs[clean_name] = pd.read_csv(file_path, encoding='latin1')
            
    print(f"Loaded {len(dfs)} raw files successfully.\n")
    return dfs

def run_preprocessing():
    dfs = load_data()
    print("Starting data cleaning pipeline...")
    processed_keys = []

    # clean products
    prod_key = 'adventureworks_product_lookup'
    prod_df = dfs.get(prod_key)
    if prod_df is not None:
        processed_keys.append(prod_key)
        print(" -> Cleaning Products...")
        prod_df = prod_df.drop(columns=['ProductSize'], errors='ignore')
        prod_df['SKUType'] = prod_df['ProductSKU'].str.split('-').str[0]
        prod_df['ProductStyle'] = prod_df['ProductStyle'].replace('0', 'N/A')
        prod_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'dim_product.csv'), index=False)

    # clean customers
    cust_key = 'adventureworks_customer_lookup'
    cust_df = dfs.get(cust_key)
    if cust_df is not None:
        processed_keys.append(cust_key)
        print(" -> Cleaning Customers...")
        cust_df = cust_df.dropna(subset=['CustomerKey', 'AnnualIncome', 'Gender'])
        
        names = ['Prefix', 'FirstName', 'LastName']
        for col in names:
            cust_df[col] = cust_df[col].fillna('').astype(str).str.capitalize()
            
        cust_df['FullName'] = (cust_df['Prefix'] + " " + cust_df['FirstName'] + " " + cust_df['LastName']).str.strip()
        cust_df['BirthDate'] = pd.to_datetime(cust_df['BirthDate']).dt.date
        cust_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'dim_customer.csv'), index=False)

    # clean calendar
    cal_key = 'adventureworks_calendar_lookup'
    cal_df = dfs.get(cal_key)
    if cal_df is not None:
        processed_keys.append(cal_key)
        print(" -> Cleaning Calendar...")
        cal_df = pd.DataFrame({'Date': pd.to_datetime(cal_df['Date'])})
        cal_df['DayName'] = cal_df['Date'].dt.day_name()
        cal_df['StartOfWeek'] = (cal_df['Date'] - pd.to_timedelta(cal_df['Date'].dt.dayofweek, unit='D')).dt.date
        cal_df['StartOfMonth'] = cal_df['Date'].dt.to_period('M').dt.start_time.dt.date
        cal_df['StartOfQuarter'] = cal_df['Date'].dt.to_period('Q').dt.start_time.dt.date
        cal_df['MonthName'] = cal_df['Date'].dt.month_name()
        cal_df['MonthNumber'] = cal_df['Date'].dt.month
        cal_df['StartOfYear'] = cal_df['Date'].dt.to_period('Y').dt.start_time.dt.date
        cal_df['Year'] = cal_df['Date'].dt.year
        cal_df['Date'] = cal_df['Date'].dt.date
        cal_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'dim_calendar.csv'), index=False)

    # clean and combine sales data
    print(" -> Cleaning and Combining Sales Data...")
    sales_frames = []
    for year in ['2020', '2021', '2022']:
        sales_key = f'adventureworks_sales_data_{year}'
        sales_df = dfs.get(sales_key)
        
        if sales_df is not None:
            processed_keys.append(sales_key)
            sales_df['OrderDate'] = pd.to_datetime(sales_df['OrderDate'], format='mixed', dayfirst=True).dt.date
            sales_df['StockDate'] = pd.to_datetime(sales_df['StockDate'], format='mixed', dayfirst=True).dt.date
            sales_frames.append(sales_df)
    
    if sales_frames:
        fact_sales = pd.concat(sales_frames, ignore_index=True)
        fact_sales.to_csv(os.path.join(CLEAN_DATA_PATH, 'fact_sales.csv'), index=False)

    for key, df in dfs.items():
        if key not in processed_keys:
            clean_filename = key.replace('adventureworks_', '') + '.csv'
            df.to_csv(os.path.join(CLEAN_DATA_PATH, clean_filename), index=False)
            print(f"    Passed through: {clean_filename}")

    print(f"SUCCESS: All files are ready in: {CLEAN_DATA_PATH}")

if __name__ == "__main__":
    run_preprocessing()