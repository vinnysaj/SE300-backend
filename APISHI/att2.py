import requests
import psycopg2
import json
import time
from passwords import passpee
from dotenv import load_dotenv, find_dotenv
import psycopg2
import time
import geopy.distance
key1, dbname1, user1, password1, host1, api_key,api_host = passpee()

# print(dbname1)
def fetch_live_data(api_key, dbname1, user1, password1, host1, api_host):
    print("Fetching live data...")
    # id = requests.get(api_host)
    # print(api_host)
    # print(api_key)
    # id = requests.get(url= api_host)
    # id = 'UAL1234-1234567890-airline-0123'
    # def pullfromprevdb():
    #     with connection.cursor() as cursor1:
    #         cursor1.execute("SELECT * FROM myapp_scroltable")
    #         rows2 = dictfetchall(cursor1)
    # connection  = psycopg2.connect()

    # cunt = connection.cursor()
    # print(dbname1, user1, password1, host1)

    con1 = psycopg2.connect(dbname=dbname1, user=user1, password=password1, host=host1)
    cursor1 = con1.cursor()
    cursor1.execute('SELECT * FROM planes')
    rows = cursor1.fetchall() 
    for row in rows:
        ident = row[2]
    # ident = 'N317FR'
    # ident = 'N7897W'
    # id = "118404621084942097937"
    url = f"https://aeroapi.flightaware.com/aeroapi/flights/{ident}"
    # url = f"https://aeroapi.flightaware.com/aeroapi/flights/{id}/track"
    # print(url)
    headers = {
        'x-apikey': api_key,
        'x-apihost':api_host,
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print("Data successfully fetched from the API.")
        information = response.json()
        return information, ident
    else:
        print(f"Failed to fetch data: {response.status_code}, {response.text}")
        return None

# def loadhistorical(file_path):
#     with open(file_path, 'r') as JSONfile:
#         return json.load(JSONfile)

def insert_data_to_db(information, ident):
    while True: 
        print("Inserting data to the database...")
        flights = information['flights']
        con = psycopg2.connect(dbname=dbname1, user=user1, password=password1, host=host1)
        curr = con.cursor()
        # curr.execute('''DROP TABLE IF EXISTS ADBSE400''')
        curr.execute('''CREATE TABLE IF NOT EXISTS ADBSE400 (
                ident VARCHAR,
                id VARCHAR,
                Trip_Explained VARCHAR,
                distance REAL)''')
        print('hello')
        con.commit()
        for flight in flights:
            try:
                id = flight['fa_flight_id']
                url1 = f"https://aeroapi.flightaware.com/aeroapi/flights/{id}/position"
                
                # print(id, ident)
                # url2 = f"https://aeroapi.flightaware.com/aeroapi/airports/'UAL21'/flights/scheduled_arrivals"
                headers1 = {
                    'x-apikey': api_key,
                    'x-apihost':api_host,
            }
                response1 = requests.get(url1, headers=headers1)
                # response4timez = requests.get(url2, headers=headers1)
                # print(response4timez.json())
                idinfo = response1.json()
                print(idinfo) 
                # print(idinfo['code_icao'])

                origin = idinfo['origin']
                destination = idinfo['destination']
                orgy = origin['city']
                desty = destination['city']
                # print(idinfo)
                Debrief = f"{orgy} to {desty}"
                # print(Debrief)
                if origin and destination:

                    

                    origurl = "https://aeroapi.flightaware.com/aeroapi"+origin['airport_info_url']
                    destinurl = "https://aeroapi.flightaware.com/aeroapi"+destination['airport_info_url']
                    # print(origurl)
                    # print(destinurl)
                    # time.sleep(10)
                    response2 = requests.get(origurl, headers=headers1)
                    response3 = requests.get(destinurl, headers=headers1)
                    longorg = (response2.json())['longitude']
                    latorg = (response2.json())['latitude']
                    longorg1 = (response3.json())['longitude']
                    latorg1 = (response3.json())['latitude']
                    # print(longorg, latorg, longorg1, latorg1)
                    cord1 = (latorg, longorg)
                    cord2 = (latorg1, longorg1)
                    distance = geopy.distance.geodesic(cord1, cord2).mi
                    con = psycopg2.connect(dbname=dbname1, user=user1, password=password1, host=host1)
                    curr = con.cursor()
                    # print(ident)
                    try:
                        curr.execute(''' INSERT INTO ADBSE400 (ident ,id, Trip_Explained, distance) VALUES (%s,%s,%s, %s)''', (ident, id, Debrief, distance))
                        con.commit()
                    except psycopg2.Error as e:
                        # con.rollback()
                        print(f'error: {e}')
                        continue
                    time.sleep(10)
                else:
                    print('No more trips found for this plane')
                    continue
            except Exception as e:
                print('no more trips found')
                print(f"There may be an error: {e}")
                time.sleep(5)

            time.sleep(10)
        
            
information, ident = fetch_live_data(api_key, dbname1, user1, password1, host1, api_host)
insert_data_to_db(information, ident)

# print(information)
# def process_live_data_continuously(api_key, interval=10):
#     print("Starting to process live data continuously...")
#     if True:
#         con = psycopg2.connect(dbname=dbname1, user=user1, password=password1, host=host1)
#         curr = con.cursor()
#         curr.execute('''DROP TABLE IF EXISTS ADBSE400''')
#         curr.execute('''CREATE TABLE IF NOT EXISTS ADBSE400 (
#             ident VARCHAR,
#             id VARCHAR,
#             distance REAL)''')
#         insert_data_to_db(information, ident)
#         print('hello')
#         con.commit()
#     else:
#         print('nope')
#     # time.sleep(interval)
#     print('problem1')
# process_live_data_continuously(api_key, interval=10)
# print("Connecting to the database...")
