# ml_model.py - AI Feature 1: Personalized Pet Care Recommendation
# Using Scikit-learn for Classification Algorithms

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import sqlite3
import json
import pickle
import os
from datetime import datetime

MODEL_PATH = 'ml_models/'
os.makedirs(MODEL_PATH, exist_ok=True)

class PetCareRecommender:
    """AI-powered pet care recommendation system using Random Forest"""

    def __init__(self):
        self.models = {}
        self.encoders = {}
        self.is_trained = False

    def _get_training_data(self):
        """Fetch training data from database"""
        conn = sqlite3.connect('secure_auth.db')
        conn.row_factory = sqlite3.Row

        # Get pets with their data
        pets = conn.execute("""
            SELECT 
                p.id,
                p.pet_type,
                p.breed,
                p.age,
                p.gender,
                p.weight,
                p.medical_history,
                p.allergies,
                COUNT(DISTINCT v.id) as vaccine_count,
                COUNT(DISTINCT a.id) as appointment_count
            FROM pets p
            LEFT JOIN vaccinations v ON p.id = v.pet_id
            LEFT JOIN appointments a ON p.id = a.pet_id AND a.status = 'completed'
            GROUP BY p.id
        """).fetchall()

        conn.close()
        return [dict(p) for p in pets]

    def _preprocess_data(self, pets_data):
        """Convert raw data to features for ML model"""
        if not pets_data:
            return None, None

        df = pd.DataFrame(pets_data)

        # Handle missing values
        df['breed'] = df['breed'].fillna('Unknown')
        df['medical_history'] = df['medical_history'].fillna('None')
        df['allergies'] = df['allergies'].fillna('None')
        df['gender'] = df['gender'].fillna('Unknown')
        df['weight'] = df['weight'].fillna(0)
        df['age'] = df['age'].fillna(0)
        df['vaccine_count'] = df['vaccine_count'].fillna(0)
        df['appointment_count'] = df['appointment_count'].fillna(0)

        # Encode categorical variables
        categorical_cols = ['pet_type', 'breed', 'gender', 'medical_history', 'allergies']

        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                # Fit with all possible values
                all_values = df[col].unique()
                self.encoders[col].fit(all_values)

            # Transform with fallback for unseen values
            df[col + '_encoded'] = df[col].apply(
                lambda x: self.encoders[col].transform([x])[0] 
                if x in self.encoders[col].classes_ 
                else 0
            )

        # Create feature matrix
        feature_cols = [
            'age', 'weight', 
            'pet_type_encoded', 'breed_encoded', 'gender_encoded',
            'medical_history_encoded', 'allergies_encoded',
            'vaccine_count', 'appointment_count'
        ]

        X = df[feature_cols].values

        # Create target labels for different classifications
        # 1. Vaccination Priority (0=Low, 1=Medium, 2=High)
        y_vaccine = df.apply(self._calculate_vaccine_priority, axis=1).values

        # 2. Grooming Frequency (0=Monthly, 1=Bi-weekly, 2=Weekly)
        y_grooming = df.apply(self._calculate_grooming_frequency, axis=1).values

        # 3. Health Risk Level (0=Low, 1=Medium, 2=High)
        y_health = df.apply(self._calculate_health_risk, axis=1).values

        return X, {'vaccine': y_vaccine, 'grooming': y_grooming, 'health': y_health}

    def _calculate_vaccine_priority(self, row):
        """Calculate vaccination priority based on pet data"""
        score = 0

        # Age factor - younger pets need more vaccines
        if row['age'] < 1:
            score += 2
        elif row['age'] < 3:
            score += 1

        # Medical history factor
        if row['medical_history'] not in [None, 'None', '']:
            score += 1

        # Breed factor - some breeds need more care
        high_risk_breeds = ['Poodle', 'German Shepherd', 'Labrador', 'Golden Retriever', 'Bulldog']
        if row['breed'] in high_risk_breeds:
            score += 1

        # Vaccine count factor
        if row['vaccine_count'] < 2:
            score += 1

        if score >= 3:
            return 2  # High
        elif score >= 1:
            return 1  # Medium
        return 0  # Low

    def _calculate_grooming_frequency(self, row):
        """Calculate grooming frequency based on pet data"""
        score = 0

        # Pet type
        if row['pet_type'] == 'Dog':
            score += 2
        else:
            score += 1

        # Breed factor - long hair breeds need more grooming
        long_hair_breeds = ['Poodle', 'Shih Tzu', 'Maltese', 'Persian', 'Siberian']
        if row['breed'] in long_hair_breeds:
            score += 2

        # Age factor - older pets need more grooming
        if row['age'] > 10:
            score += 1

        if score >= 4:
            return 2  # Weekly
        elif score >= 2:
            return 1  # Bi-weekly
        return 0  # Monthly

    def _calculate_health_risk(self, row):
        """Calculate health risk level based on pet data"""
        score = 0

        # Medical history
        if row['medical_history'] not in [None, 'None', '']:
            medical_text = str(row['medical_history']).lower()
            serious_conditions = ['cancer', 'diabetes', 'heart', 'kidney', 'liver']
            if any(cond in medical_text for cond in serious_conditions):
                score += 3
            else:
                score += 1

        # Allergies
        if row['allergies'] not in [None, 'None', '']:
            score += 2

        # Age factor
        if row['age'] > 10:
            score += 2
        elif row['age'] > 7:
            score += 1

        # Weight factor
        if row['weight'] > 0:
            if row['weight'] > 30 and row['pet_type'] == 'Dog':
                score += 1
            elif row['weight'] > 8 and row['pet_type'] == 'Cat':
                score += 1

        if score >= 4:
            return 2  # High
        elif score >= 2:
            return 1  # Medium
        return 0  # Low

    def train_models(self):
        """Train all ML models using current database data"""
        pets_data = self._get_training_data()

        if not pets_data or len(pets_data) < 5:
            print("Not enough data to train models. Using default recommendations.")
            self.is_trained = False
            return False

        X, y_dict = self._preprocess_data(pets_data)

        if X is None or len(X) < 5:
            print("Not enough features to train models.")
            self.is_trained = False
            return False

        # Split data
        X_train, X_test, y_train_dict, y_test_dict = train_test_split(
            X, y_dict['vaccine'], test_size=0.2, random_state=42
        )

        # Train models for each prediction type
        for target_name, y_values in y_dict.items():
            # Ensure enough samples for each class
            unique_classes = np.unique(y_values)
            if len(unique_classes) < 2:
                print(f"Not enough variety for {target_name}. Skipping.")
                continue

            # Split for this target
            X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(
                X, y_values, test_size=0.2, random_state=42
            )

            # Train Random Forest
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            model.fit(X_train_t, y_train_t)

            # Evaluate
            y_pred = model.predict(X_test_t)
            accuracy = accuracy_score(y_test_t, y_pred)
            print(f"✅ {target_name} model accuracy: {accuracy:.2f}")

            # Save model
            self.models[target_name] = model
            self._save_model(target_name, model)

        self.is_trained = True
        return True

    def _save_model(self, name, model):
        """Save model to disk"""
        with open(f"{MODEL_PATH}{name}_model.pkl", 'wb') as f:
            pickle.dump(model, f)

        # Save encoders
        with open(f"{MODEL_PATH}encoders.pkl", 'wb') as f:
            pickle.dump(self.encoders, f)

    def _load_models(self):
        """Load trained models from disk"""
        try:
            for name in ['vaccine', 'grooming', 'health']:
                with open(f"{MODEL_PATH}{name}_model.pkl", 'rb') as f:
                    self.models[name] = pickle.load(f)

            with open(f"{MODEL_PATH}encoders.pkl", 'rb') as f:
                self.encoders = pickle.load(f)

            self.is_trained = True
            return True
        except FileNotFoundError:
            print("No trained models found. Training new models...")
            return self.train_models()
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

    def predict_pet_care(self, pet_data):
        """Generate personalized care recommendations for a single pet"""
        # Try to load models if not trained
        if not self.is_trained:
            if not self._load_models():
                # Return default recommendations if no models
                return self._get_default_recommendations(pet_data)

        try:
            # Preprocess pet data
            features = self._preprocess_single_pet(pet_data)

            if features is None:
                return self._get_default_recommendations(pet_data)

            # Make predictions
            predictions = {}
            for name, model in self.models.items():
                try:
                    pred = model.predict([features])[0]
                    predictions[name] = int(pred)
                except Exception as e:
                    print(f"Error predicting {name}: {e}")
                    predictions[name] = 1  # Default to medium

            # Generate recommendations based on predictions
            return self._generate_recommendations(pet_data, predictions)

        except Exception as e:
            print(f"Error in prediction: {e}")
            return self._get_default_recommendations(pet_data)

    def _preprocess_single_pet(self, pet_data):
        """Preprocess a single pet's data for prediction"""
        try:
            # Fill missing values
            breed = pet_data.get('breed', 'Unknown') or 'Unknown'
            medical_history = pet_data.get('medical_history', 'None') or 'None'
            allergies = pet_data.get('allergies', 'None') or 'None'
            gender = pet_data.get('gender', 'Unknown') or 'Unknown'
            age = float(pet_data.get('age', 0) or 0)
            weight = float(pet_data.get('weight', 0) or 0)
            pet_type = pet_data.get('pet_type', 'Dog') or 'Dog'
            vaccine_count = int(pet_data.get('vaccine_count', 0) or 0)
            appointment_count = int(pet_data.get('appointment_count', 0) or 0)

            # Encode using saved encoders
            encoded_features = []
            for col, value in [
                ('pet_type', pet_type),
                ('breed', breed),
                ('gender', gender),
                ('medical_history', medical_history),
                ('allergies', allergies)
            ]:
                if col in self.encoders:
                    try:
                        encoded = self.encoders[col].transform([value])[0]
                    except:
                        encoded = 0
                else:
                    encoded = 0
                encoded_features.append(encoded)

            # Create feature vector
            features = [
                age,
                weight,
                encoded_features[0],  # pet_type
                encoded_features[1],  # breed
                encoded_features[2],  # gender
                encoded_features[3],  # medical_history
                encoded_features[4],  # allergies
                vaccine_count,
                appointment_count
            ]

            return features

        except Exception as e:
            print(f"Error preprocessing pet: {e}")
            return None

    def _generate_recommendations(self, pet_data, predictions):
        """Generate human-readable recommendations based on predictions"""
        pet_name = pet_data.get('name', 'Your pet')
        age = pet_data.get('age', 0)
        breed = pet_data.get('breed', 'Unknown')
        pet_type = pet_data.get('pet_type', 'Dog')

        # Map prediction values to labels
        vaccine_levels = {0: 'Low', 1: 'Medium', 2: 'High'}
        grooming_levels = {0: 'Monthly', 1: 'Bi-weekly', 2: 'Weekly'}
        health_levels = {0: 'Low', 1: 'Medium', 2: 'High'}

        vaccine_priority = vaccine_levels.get(predictions.get('vaccine', 1), 'Medium')
        grooming_freq = grooming_levels.get(predictions.get('grooming', 1), 'Bi-weekly')
        health_risk = health_levels.get(predictions.get('health', 1), 'Medium')

        # Build recommendations
        recommendations = []

        # 1. Vaccination recommendation
        if vaccine_priority == 'High':
            recommendations.append(
                f"🔴 {pet_name} has HIGH vaccination priority. Schedule core vaccines immediately."
            )
        elif vaccine_priority == 'Medium':
            recommendations.append(
                f"🟡 {pet_name} has MEDIUM vaccination priority. Ensure vaccines are up to date."
            )
        else:
            recommendations.append(
                f"🟢 {pet_name} has LOW vaccination priority. Follow standard vaccination schedule."
            )

        # 2. Grooming recommendation
        if grooming_freq == 'Weekly':
            recommendations.append(
                f"✂️ {pet_name} needs WEEKLY grooming due to breed and coat type."
            )
        elif grooming_freq == 'Bi-weekly':
            recommendations.append(
                f"✂️ {pet_name} needs BI-WEEKLY grooming for optimal coat health."
            )
        else:
            recommendations.append(
                f"✂️ {pet_name} needs MONTHLY grooming for basic care."
            )

        # 3. Health risk recommendation
        if health_risk == 'High':
            recommendations.append(
                f"⚠️ {pet_name} has HIGH health risk. Schedule a comprehensive health check-up."
            )
        elif health_risk == 'Medium':
            recommendations.append(
                f"ℹ️ {pet_name} has MEDIUM health risk. Regular monitoring recommended."
            )
        else:
            recommendations.append(
                f"✅ {pet_name} has LOW health risk. Maintain current care routine."
            )

        # 4. Breed-specific recommendations
        breed_specific = self._get_breed_specific_recommendations(breed, pet_type)
        if breed_specific:
            recommendations.append(breed_specific)

        # 5. Age-specific recommendations
        if age and int(age) > 10:
            recommendations.append(
                f"👴 {pet_name} is a senior pet ({age} years). Consider senior-specific care and more frequent check-ups."
            )
        elif age and int(age) < 1:
            recommendations.append(
                f"🐾 {pet_name} is a puppy/kitten ({age} years). Follow the accelerated vaccination and socialization schedule."
            )

        # 6. Allergy recommendation
        allergies = pet_data.get('allergies', '')
        if allergies and allergies not in ['', 'None', 'none', 'N/A']:
            recommendations.append(
                f"⚠️ {pet_name} has allergies: {allergies}. Avoid triggers and consider allergy management plan."
            )

        # 7. Medical history recommendation
        medical_history = pet_data.get('medical_history', '')
        if medical_history and medical_history not in ['', 'None', 'none', 'N/A']:
            recommendations.append(
                f"📋 {pet_name} has medical history: {medical_history}. Monitor for recurrence and follow-up as needed."
            )

        return {
            'pet_name': pet_name,
            'vaccine_priority': vaccine_priority,
            'grooming_frequency': grooming_freq,
            'health_risk': health_risk,
            'recommendations': recommendations,
            'prediction_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    def _get_breed_specific_recommendations(self, breed, pet_type):
        """Get breed-specific care recommendations"""
        if not breed:
            return None

        breed_lower = breed.lower()

        # Dog breeds
        if pet_type == 'Dog':
            if 'labrador' in breed_lower or 'golden' in breed_lower:
                return "🐕 Labrador/Golden Retrievers are prone to hip dysplasia. Recommended: Joint supplements and regular exercise."
            elif 'poodle' in breed_lower:
                return "🐩 Poodles need regular ear cleaning and professional grooming every 4-6 weeks."
            elif 'bulldog' in breed_lower:
                return "🐕 Bulldogs are brachycephalic. Avoid strenuous exercise in hot weather and keep them at healthy weight."
            elif 'german shepherd' in breed_lower:
                return "🐕 German Shepherds need mental stimulation and may benefit from hip/elbow screening."
            elif 'shih tzu' in breed_lower or 'maltese' in breed_lower:
                return "🐕 Small breeds like Shih Tzu need daily eye cleaning and regular dental care."

        # Cat breeds
        elif pet_type == 'Cat':
            if 'persian' in breed_lower:
                return "🐈 Persians need daily eye cleaning and regular brushing to prevent matting."
            elif 'siamese' in breed_lower:
                return "🐈 Siamese are vocal and social. Provide plenty of interaction and environmental enrichment."
            elif 'maine coon' in breed_lower:
                return "🐈 Maine Coons need regular grooming and are prone to hip dysplasia and heart conditions."

        return None

    def _get_default_recommendations(self, pet_data):
        """Return default recommendations when model is not available"""
        pet_name = pet_data.get('name', 'Your pet')
        return {
            'pet_name': pet_name,
            'vaccine_priority': 'Medium',
            'grooming_frequency': 'Bi-weekly',
            'health_risk': 'Medium',
            'recommendations': [
                f"ℹ️ {pet_name}: Follow standard pet care guidelines.",
                f"📅 Schedule regular vaccination and wellness visits.",
                f"✂️ Maintain regular grooming routine."
            ],
            'prediction_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

# Singleton instance
_recommender = None

def get_recommender():
    """Get or create the recommender instance"""
    global _recommender
    if _recommender is None:
        _recommender = PetCareRecommender()
    return _recommender

def train_models():
    """Train ML models using current data"""
    recommender = get_recommender()
    return recommender.train_models()