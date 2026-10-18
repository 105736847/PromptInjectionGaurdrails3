import model
import connection

db = []

def init():
    connection.init_conn()

def process_prompt(prompt):
    result = model.process_prompt(prompt)
    result["prompt"] = prompt
    db.append(result)

def get_prompts():
    return db