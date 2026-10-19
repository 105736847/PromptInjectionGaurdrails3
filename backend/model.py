# warning supression due to model joblibs being from different sklearn models
import warnings
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

from sub_models.svm_predict import predict_supervised
from sub_models.unsupervised_predict import predict_hdbscan
from sub_models.attack_type_kmeans import predict_attack_type

def process_prompt(prompt):
    result = {}
    result['supervised'] = predict_supervised(prompt)
    result['binary_clustering'] = predict_hdbscan(prompt)

    # # conditional
    # attack_type = None
    # if supervised_result == 1 or clustering_result == 1:
    #     attack_type = predict_attack_type(prompt)

    # non-conditional
    attack_type = predict_attack_type(prompt)

    result['attack_type'] = attack_type

    return result