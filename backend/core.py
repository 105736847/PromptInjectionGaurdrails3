import model
import connection

import time
from datetime import datetime

db = {}
next_id = 0

def init():
    connection.init_conn()

def process_prompt(prompt):
    global next_id
    result = model.process_prompt(prompt)
    result["prompt"] = prompt
    result["timestamp"] = time.time()
    result["datetime"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    db[next_id] = result
    next_id += 1

def get_results():
    return db

def delete_result(id):
    db.pop(id)

def get_result(id):
    return db[id]

def get_latest_result_id():
    return max(db.items(), key=lambda item: item[1].get('timestamp', 0))[0]