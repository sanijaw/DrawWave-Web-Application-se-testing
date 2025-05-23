import numpy as np

def store_coordinates(x, y, z):
    return np.array([x, y, z])

def calculate_distance(p1, p2):
    return np.linalg.norm(p1 - p2)
