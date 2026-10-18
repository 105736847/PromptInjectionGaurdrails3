import model
import db
import connection

import time
from datetime import datetime

def init():
    db.init()
    connection.init_conn()

def process_prompt(prompt):
    result = model.process_prompt(prompt)
    result["prompt"] = prompt
    result["timestamp"] = time.time()
    result["datetime"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    db.add_result(result)

def get_results():
    return db.get_results()

def delete_result(id):
    db.delete_result(id)

def get_result(id):
    return db.get_result(id)

def get_latest_result_id():
    return db.get_latest_result_id()