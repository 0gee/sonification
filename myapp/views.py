import requests
import numpy as np
from django.shortcuts import render
from datetime import datetime, timedelta
import logging
import time
from django.http import HttpResponse

def home(request):
    top_crypto_prices = get_top_cryptos_prices()
    return render(request, 'myapp/home.html', {'top_cryptos': top_crypto_prices})

def get_top_cryptos_prices():
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    parameters = {
        'start': '1',
        'limit': '10',
        'convert': 'USD'
    }
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': 'ec2dbebc-4ef4-431d-82bc-c8a3fadb66f0',
    }

    response = requests.get(url, headers=headers, params=parameters)
    data = response.json()
    return data['data']

def map_symbol_to_coingecko_id(symbol):
   symbol = symbol.lower()
   mapping = {'btc': 'bitcoin', 'eth': 'ethereum', 'usdt': 'tether', 'bnb': 'binancecoin', 
               'sol': 'solana', 'xrp': 'ripple', 'usdc': 'usd-coin', 'ada': 'cardano', 'steth': 'staked-ether', 
               'avax': 'avalanche-2', 'doge': 'dogecoin', 'dot': 'polkadot', 'trx': 'tron', 
               'link': 'chainlink', 'ton': 'the-open-network', 'matic': 'matic-network', 
               'wbtc': 'wrapped-bitcoin', 'shib': 'shiba-inu', 'dai': 'dai', 'ltc': 'litecoin'}
   return mapping.get(symbol.lower())


def get_top_cryptos():
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    parameters = {
        'start': '1',
        'limit': '1',
        'convert': 'USD'
    }
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': 'ec2dbebc-4ef4-431d-82bc-c8a3fadb66f0',
    }


    response = requests.get(url, headers=headers, params=parameters)
    data = response.json()

    prices_dict = {}
    for crypto in data['data']:
        name = crypto['name']
        price = crypto['quote']['USD']['price']
        prices_dict[name] = price

    return prices_dict

def get_crypto_data(coin_id, days=30):
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "usd",
        "days": days
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        if 'prices' in data:
            daily_prices = {}
            for price_data in data['prices']:
                timestamp, price = price_data
                date = datetime.utcfromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')
                if date not in daily_prices:  # Keep the first price for each day
                    daily_prices[date] = price
            return daily_prices
        else:
            raise KeyError("The key 'prices' was not found in the response.")
    else:
        response.raise_for_status()

# Example usage
# get_crypto_data(coin_id='bitcoin', days=30)



def calculate_return_std(prices_list):
    # Convert prices to a list to easily access previous day's price

    # Calculate daily returns using ln(current day / previous day)
    daily_returns = [np.log(prices_list[i] / prices_list[i-1]) for i in range(1, len(prices_list))]

    # Calculate standard deviation of these daily returns
    std_dev_returns = np.std(daily_returns)
    std_dev_returns = std_dev_returns / np.sqrt(1/365)  # Annualize the standard deviation
    return std_dev_returns

def calculate_btc_future_bounds(starting_price, std_dev):
    # Calculate the time elapsed in years since today's morning (assumed at 00:00:00 UTC)
    current_time = datetime.utcnow()
    morning_time = current_time.replace(hour=00, minute=00, second=0, microsecond=0)
    elapsed_time = current_time - morning_time
    t = elapsed_time.total_seconds() / (24 * 3600 * 365)  # Convert to years
    
    # Calculate the upper and lower bounds
    upper_bound = starting_price * np.exp(std_dev * np.sqrt(t))
    lower_bound = starting_price * np.exp(-std_dev * np.sqrt(t))
    return upper_bound, lower_bound


def get_top_cryptos_from_coinmarketcap():
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    parameters = {'start': '1', 'limit': '10', 'convert': 'USD'}
    headers = {'Accepts': 'application/json', 'X-CMC_PRO_API_KEY': 'ec2dbebc-4ef4-431d-82bc-c8a3fadb66f0'}

    response = requests.get(url, headers=headers, params=parameters)
    if response.status_code != 200:
        response.raise_for_status()

    data = response.json()

    cryptos = {}
    for crypto in data['data']:
        symbol = crypto['symbol'].lower()  # Standard symbol like 'BTC', 'ETH'
        price = crypto['quote']['USD']['price']
        cryptos[symbol] = price

    return cryptos

def get_latest_crypto_price(crypto_id):
    # Construct the URL for the CoinGecko API endpoint
    # Replace 'bitcoin' with the appropriate crypto_id
    url = f'https://api.coingecko.com/api/v3/simple/price?ids={crypto_id}&vs_currencies=usd'

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad status codes

        # Parse the JSON response
        data = response.json()

        # Extract the price
        price = data[crypto_id]['usd']
        print(f"The price of {crypto_id} is currently ${price}")
        return price

    except requests.RequestException as e:
        print(f"Error fetching price for {crypto_id}: {e}")
        return None
    

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

@csrf_exempt
def update_portfolio(request):
    if request.method == 'POST':
        crypto_name = request.POST.get('crypto_name')
        amount = request.POST.get('amount')
        
        print(f"Received crypto_name={crypto_name} and amount={amount}")

        return JsonResponse({'status': 'success', 'message': 'Portfolio updated'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

