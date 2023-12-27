from celery import shared_task
from .views import *
import time
import redis
import random 
import requests

cache = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

@shared_task
def get_crypto_prices():
    print("start")
    crypto_ids = []
    time.sleep(30)
    top_crypto = get_top_cryptos_from_coingecko()
    count = 1
    for symbol,price in top_crypto.items():
        if count % 4 == 0:
            print("sleep")
            time.sleep(60)
        id = map_symbol_to_coingecko_id(symbol)
        crypto_ids.append(id)

        history = get_crypto_data(id, 30)
        #print(id, history)
        count+=1

        # Extract prices from the history dictionary
        prices_list = list(history.values())

        # Calculate standard deviation of returns
        std_dev_returns = calculate_return_std(prices_list)
        print(id, history, std_dev_returns)

        cache.set(f'{id}_price', price)
        cache.set(f'{id}_std_dev', std_dev_returns)
        
        cache.delete('crypto_ids')  # Clear existing list
        cache.rpush('crypto_ids', *crypto_ids)
        print("crypto_ids",crypto_ids)



@shared_task
def bounds_calculation():
    # Retrieve a list of all cryptocurrency IDs that were processed
    # This assumes you have a way to store and retrieve this list
    # For example, you might modify get_crypto_prices to store the IDs in a Redis list
    crypto_ids = cache.lrange('crypto_ids', 0, -1)

    for specific_id in crypto_ids:
        # Retrieve the stored values for each cryptocurrency
        price = cache.get(f'{specific_id}_price')
        std_dev_returns = cache.get(f'{specific_id}_std_dev')
        print(f"Processing {specific_id}: Price = {price}, STD = {std_dev_returns}")

        if price and std_dev_returns:
            price = float(price)  # Convert price back to float
            std_dev_returns = float(std_dev_returns)  # Convert std_dev_returns back to float

            upper_bound, lower_bound = calculate_btc_future_bounds(price, std_dev_returns)
            print(f"{specific_id} - Upper Bound: {upper_bound}, Lower Bound: {lower_bound}")
        else:
            print(f"Required data not available for bounds calculation for {specific_id}.")

@shared_task
def check_price_sensitivity():
    portfolio_data = cache.get('global_portfolio')
 
    portfolio = json.loads(portfolio_data)  # Convert the JSON string back to a dictionary

    print(portfolio)
    crypto_ids = cache.lrange('crypto_ids', 0, -1)

    for coin_name, details in portfolio.items():
        specific_id = map_frontend_coin_to_backend_coin(coin_name)
        # Retrieve the stored values for each cryptocurrency
        print("specific_id", specific_id)
        original_price = float(cache.get(f'{specific_id}_price'))
        std_dev_returns = float(cache.get(f'{specific_id}_std_dev'))
        sensitivity = details.get('sensitivity')  # Assuming maximum sensitivity for demonstration
        amount = details.get('amount', 0)
        print("amount", amount)
        print("sensitvity", sensitivity)
        print("returns", std_dev_returns)

        threshold = float(sensitivity) * std_dev_returns

        upper_bound, lower_bound = calculate_btc_future_bounds(original_price, threshold)

        # Fetch the latest price for the cryptocurrency
        print("sleeping")
        time.sleep(12)
        latest_price = get_latest_crypto_price(specific_id)  # You need to implement this function

        # Check if the latest price is outside the bounds
        if latest_price > upper_bound:
            print(f"Alert: {specific_id} price is above the upper bound! Current Price: {latest_price}, Upper Bound: {upper_bound}")
        elif latest_price < lower_bound:
            print(f"Alert: {specific_id} price is below the lower bound! Current Price: {latest_price}, Lower Bound: {lower_bound}")
        else:
            print(f"{specific_id} price is within bounds.")

        print(f"{specific_id} - Upper Bound: {upper_bound}, Lower Bound: {lower_bound}, Sensitivity: {sensitivity}")
