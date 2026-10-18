import re
import math
from pathlib import Path
from collections import Counter

import emoji
import joblib
import pandas as pd


# must same order used during SVM training
FEATURE_COLUMNS = [
    "length",
    "emoji_count",
    "word_count",
    "number_count",
    "punctuation_count",
    "exclamation_count",
    "question_count",
    "special_character_count",
    "attack_phrase_count",
    "override_phrase_count",
    "suspicious_action_count",
    "sensitive_target_count",
    "entropy",
]

# attack phrases used during feature engineering
ATTACK_PHRASES = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "disregard the above",
    "you are now",
    "system prompt",
    "act as",
    "jailbreak",
    "do anything now",
    "new instructions",
]
# phrases that try to override or bypass existing instructions
OVERRIDE_PHRASES = [
    "ignore",
    "disregard",
    "bypass",
    "override",
    "forget",
    "ignore limits",
    "ignore restrictions",
    "ignore rules",
]
# action words that may appear in suspicious prompts
SUSPICIOUS_ACTIONS = [
        "reveal",
        "show",
        "dump",
        "share",
        "extract",
        "execute",
        "access",
        "display",

        # execution-related words
        "run",
        "eval",
        "bash",
        "shell",

        # encoding / obfuscation-related words
        "decode",
        "base64",
        "encoded",
        "hexadecimal",
        "rot13"
]
# sensitive information that malicious prompts may try to access
SENSITIVE_TARGETS = [
    "password",
    "passwords",
    "api key",
    "api keys",
    "training data",
    "source code",
    "system prompt",
    "model weights",
    "session cookies",
    "user sessions",
    "memory contents",
    "internal logs",
    "system logs",
]


# get the main project folder
# svm_predict.py is inside the supervised folder
PROJECT_ROOT = Path(__file__).resolve().parent.parent
# set the path to the trained SVM model
MODEL_PATH = PROJECT_ROOT / "sub_models" / "final_svm.joblib"
# load the trained SVM model
# the model already contains StandardScaler and SVM pipeline
model = joblib.load(MODEL_PATH)

# calculate character entropy of the prompt
def entropy(text):

    if not text:
        return 0.0

    counts = Counter(text)
    n = len(text)

    return -sum(
        count / n * math.log2(count / n)
        for count in counts.values()
    )

# normalize a new user prompt in the same way as the training dataset
def normalize_prompt(prompt):

    # convert text to lowercase
    prompt = prompt.lower()
    # replace multiple spaces, tabs or new lines with one space
    prompt = re.sub(r"\s+", " ", prompt)
    # remove spaces at the beginning and end
    return prompt.strip()


# count how many predefined phrases appear in a prompt
def count_phrases(prompt, phrases):

    count = 0
    # go through each phrase and count its occurrence
    for phrase in phrases:
        count += prompt.count(phrase)
    return count


# convert a new user prompt into the same features used to train the SVM
def create_prediction_features(prompt):

    # count emoji using the original prompt
    # this follows the same preprocessing used during training
    emoji_count = sum(
        char in emoji.EMOJI_DATA
        for char in prompt
    )

    # normalize the prompt before generating the remaining features
    normalized = normalize_prompt(prompt)

    # generate all numerical features for the new prompt
    features = {

        # total number of characters
        "length": len(normalized),

        # total number of emoji
        "emoji_count": emoji_count,

        # total number of words
        "word_count":
            len(re.findall(r"\w+", normalized)),

        # total number of digits
        "number_count":
            len(re.findall(r"\d+", normalized)),

        # total number of punctuation characters
        "punctuation_count":
            len(re.findall(r"[^\w\s]", normalized)),

        # total number of exclamation marks
        "exclamation_count":
            normalized.count("!"),

        # total number of question marks
        "question_count":
            normalized.count("?"),

        # count selected special characters
        "special_character_count":
            len(
                re.findall(
                    r"[@#$%^&*_=+<>|\\/`~]",
                    normalized
                )
            ),

        # count known prompt injection phrases
        "attack_phrase_count":
            count_phrases(
                normalized,
                ATTACK_PHRASES
            ),

        # count instruction override phrases
        "override_phrase_count":
            count_phrases(
                normalized,
                OVERRIDE_PHRASES
            ),

        # count suspicious action words
        "suspicious_action_count":
            count_phrases(
                normalized,
                SUSPICIOUS_ACTIONS
            ),

        # count sensitive information targets
        "sensitive_target_count":
            count_phrases(
                normalized,
                SENSITIVE_TARGETS
            ),

        "entropy": entropy(normalized),
    }

    #convert the features into a dataframe
    #the column order must match the data used during SVM training
    return pd.DataFrame(
        [[features[column] for column in FEATURE_COLUMNS]],
        columns=FEATURE_COLUMNS,
    )


# use the trained SVM to predict whether a new prompt is benign or malicious
def predict_supervised(prompt):

    # convert the user prompt into the required model features
    features = create_prediction_features(prompt)

    
    # this is for debugging section
    # use the saved SVM model to make the prediction
    # temporary debugging
    #print("\nFeatures sent to SVM:")
    #print(features.to_string(index=False))



    prediction = model.predict(features)
    # return the prediction as an integer 0/1
    return int(prediction[0])