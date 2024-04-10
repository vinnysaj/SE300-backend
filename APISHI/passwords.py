from flask import render_template, request, redirect, url_for, session, Flask
def passpee():
    key1 = '44444444'
    dbname1 = 'se300database'
    user1= 'se300'
    password1 = 'se300'
    host1 = '10.6.0.1'
    api_key='LTL6vAkA7t4QWo4ASclRsatGOJIEraCg'
    api_host='https://aeroapi.flightaware.com/aeroapi'
    return key1, dbname1, user1, password1, host1, api_key, api_host
