# ml_model.py - AI Feature 1: Personalized Pet Care Recommendation
# Using Scikit-learn for Classification Algorithms
# ✅ UPDATED: Kasama na ang medical history at medical records

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
import re
from datetime import datetime

MODEL_PATH = 'ml_models/'
os.makedirs(MODEL_PATH, exist_ok=True)


# ── Safe Conversion Helpers ────────────────────────────────────────────
def safe_int(value, default=0):
    """Safely convert value to integer, extracting first number from strings"""
    try:
        if value is None or value == '' or value == 'None':
            return default
        if isinstance(value, str):
            match = re.search(r'-?\d+', value)
            if match:
                return int(match.group())
            return default
        return int(float(value))
    except (ValueError, TypeError):
        return default


def safe_float(value, default=0.0):
    """Safely convert value to float, extracting first number from strings"""
    try:
        if value is None or value == '' or value == 'None':
            return default
        if isinstance(value, str):
            match = re.search(r'-?\d+\.?\d*', value)
            if match:
                return float(match.group())
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


class PetCareRecommender:
    """AI-powered pet care recommendation system using Random Forest
    ✅ UPDATED: Kasama na ang medical history at medical records
    """

    def __init__(self):
        self.models = {}
        self.encoders = {}
        self.is_trained = False

    # ═══════════════════════════════════════════════════════════════════
    # ✅ UPDATED: _get_training_data() — kasama na ang medical records
    # ═══════════════════════════════════════════════════════════════════
    def _get_training_data(self):
        """Fetch training data from database (with medical records)"""
        conn = sqlite3.connect('secure_auth.db')
        conn.row_factory = sqlite3.Row

        pets = conn.execute("""
            SELECT 
                p.id,
                p.pet_type,
                p.breed,
                p.age,
                p.age_months,
                p.gender,
                p.weight,
                p.medical_history,
                p.medical_history_details,
                p.allergies,
                COUNT(DISTINCT v.id) as vaccine_count,
                COUNT(DISTINCT a.id) as appointment_count,
                COUNT(DISTINCT mr.id) as medical_record_count
            FROM pets p
            LEFT JOIN vaccinations v ON p.id = v.pet_id
            LEFT JOIN appointments a ON p.id = a.pet_id AND a.status = 'completed'
            LEFT JOIN medical_records mr ON p.id = mr.pet_id
            GROUP BY p.id
        """).fetchall()

        conn.close()
        return [dict(p) for p in pets]

    def _preprocess_data(self, pets_data):
        """Convert raw data to features for ML model"""
        if not pets_data:
            return None, None

        df = pd.DataFrame(pets_data)

        # Handle missing values - categorical
        df['breed'] = df['breed'].fillna('Unknown')
        df['medical_history'] = df['medical_history'].fillna('None')
        df['medical_history_details'] = df['medical_history_details'].fillna('{}')
        df['allergies'] = df['allergies'].fillna('None')
        df['gender'] = df['gender'].fillna('Unknown')
        df['pet_type'] = df['pet_type'].fillna('Dog')
        
        # ── SAFE NUMERIC CONVERSIONS ──────────────────────────────────
        df['age'] = df['age'].apply(lambda x: safe_float(x, 0.0))
        df['age_months'] = df['age_months'].apply(lambda x: safe_int(x, 0))
        df['weight'] = df['weight'].apply(lambda x: safe_float(x, 0.0))
        df['vaccine_count'] = df['vaccine_count'].apply(lambda x: safe_int(x, 0))
        df['appointment_count'] = df['appointment_count'].apply(lambda x: safe_int(x, 0))
        df['medical_record_count'] = df['medical_record_count'].apply(lambda x: safe_int(x, 0))

        # ✅ Compute total age in months (para mas accurate)
        df['age_in_months'] = (df['age'] * 12) + df['age_months']

        # ✅ Compute medical history severity score
        df['medical_severity'] = df.apply(self._calculate_medical_severity, axis=1)

        # Encode categorical variables
        categorical_cols = ['pet_type', 'breed', 'gender', 'medical_history', 'allergies']

        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                all_values = df[col].unique()
                self.encoders[col].fit(all_values)

            df[col + '_encoded'] = df[col].apply(
                lambda x: self.encoders[col].transform([x])[0] 
                if x in self.encoders[col].classes_ 
                else 0
            )

        # Create feature matrix
        feature_cols = [
            'age_in_months', 'weight', 
            'pet_type_encoded', 'breed_encoded', 'gender_encoded',
            'medical_history_encoded', 'allergies_encoded',
            'vaccine_count', 'appointment_count', 'medical_record_count',
            'medical_severity'
        ]

        X = df[feature_cols].values

        # Create target labels for different classifications
        y_vaccine = df.apply(self._calculate_vaccine_priority, axis=1).values
        y_grooming = df.apply(self._calculate_grooming_frequency, axis=1).values
        y_health = df.apply(self._calculate_health_risk, axis=1).values

        return X, {'vaccine': y_vaccine, 'grooming': y_grooming, 'health': y_health}

    # ═══════════════════════════════════════════════════════════════════
    # ✅ NEW: Calculate medical severity score from medical history
    # ═══════════════════════════════════════════════════════════════════
    def _calculate_medical_severity(self, row):
        """Calculate severity score based on medical history"""
        score = 0
        
        medical_text = str(row.get('medical_history', '') or '').lower()
        details_text = str(row.get('medical_history_details', '') or '').lower()
        
        combined = f"{medical_text} {details_text}"
        
        # ── Critical conditions (+3 each) ──────────────────────────
        critical = ['cancer', 'tumor', 'organ failure', 'heart failure', 'kidney failure', 
                    'liver failure', 'seizure', 'epilepsy', 'diabetes', 'parvo', 
                    'distemper', 'felv', 'fiv', 'fip', 'leukemia']
        for cond in critical:
            if cond in combined:
                score += 3
        
        # ── Serious conditions (+2 each) ──────────────────────────
        serious = ['heart', 'kidney', 'liver', 'arthritis', 'hip dysplasia', 
                   'cruciate', 'surgery', 'operation', 'fracture', 'broken bone',
                   'pancreatitis', 'cushing', 'addison', 'thyroid', 'hyperthyroid',
                   'urinary', 'flutd', 'ibd', 'inflammatory bowel']
        for cond in serious:
            if cond in combined:
                score += 2
        
        # ── Moderate conditions (+1 each) ──────────────────────────
        moderate = ['allergy', 'allergies', 'skin', 'dermatitis', 'ear infection',
                    'eye', 'cataract', 'dental', 'gingivitis', 'stomatitis',
                    'obesity', 'overweight', 'asthma', 'respiratory', 'cough',
                    'kennel cough', 'flea', 'tick', 'worm', 'mites']
        for cond in moderate:
            if cond in combined:
                score += 1
        
        # ── Count number of conditions ─────────────────────────────
        condition_count = len([c for c in combined.split(',') if c.strip()])
        score += min(condition_count, 3)  # Max +3 from count
        
        return min(score, 10)  # Cap at 10

    def _calculate_vaccine_priority(self, row):
        """Calculate vaccination priority based on pet data + medical history"""
        score = 0
        
        age_months = safe_int(row.get('age_in_months', 0), 0)
        vaccine_count = safe_int(row.get('vaccine_count', 0), 0)
        medical_severity = safe_int(row.get('medical_severity', 0), 0)

        # ✅ Age-based
        if age_months < 12:  # < 1 year
            score += 2
        elif age_months < 36:  # < 3 years
            score += 1

        # ✅ Medical history impact
        if medical_severity >= 5:
            score += 2
        elif medical_severity >= 2:
            score += 1

        # ✅ Medical history not empty
        if row.get('medical_history') not in [None, 'None', '', 'none', 'N/A']:
            score += 1

        # ✅ High-risk breeds
        high_risk_breeds = ['Poodle', 'German Shepherd', 'Labrador', 'Golden Retriever', 'Bulldog']
        if row.get('breed') in high_risk_breeds:
            score += 1

        # ✅ Low vaccine count
        if vaccine_count < 2:
            score += 1

        if score >= 4:
            return 2  # High
        elif score >= 2:
            return 1  # Medium
        return 0  # Low

    def _calculate_grooming_frequency(self, row):
        """Calculate grooming frequency based on pet data + medical history"""
        score = 0
        
        age_months = safe_int(row.get('age_in_months', 0), 0)

        # ✅ Pet type
        if row.get('pet_type') == 'Dog':
            score += 2
        else:
            score += 1

        # ✅ Long-hair breeds
        long_hair_breeds = ['Poodle', 'Shih Tzu', 'Maltese', 'Persian', 'Siberian']
        if row.get('breed') in long_hair_breeds:
            score += 2

        # ✅ Senior pets need more grooming
        if age_months > 120:  # > 10 years
            score += 1

        # ✅ Skin conditions require more grooming
        medical_text = str(row.get('medical_history', '') or '').lower()
        if any(cond in medical_text for cond in ['skin', 'dermatitis', 'allergy', 'allergies']):
            score += 1

        if score >= 4:
            return 2  # Weekly
        elif score >= 2:
            return 1  # Bi-weekly
        return 0  # Monthly

    def _calculate_health_risk(self, row):
        """Calculate health risk level based on pet data + medical history + records"""
        score = 0
        
        age_months = safe_int(row.get('age_in_months', 0), 0)
        weight = safe_float(row.get('weight', 0.0), 0.0)
        medical_severity = safe_int(row.get('medical_severity', 0), 0)
        medical_record_count = safe_int(row.get('medical_record_count', 0), 0)

        # ✅ Medical severity is the biggest factor
        score += medical_severity

        # ✅ Allergies
        if row.get('allergies') not in [None, 'None', '', 'none', 'N/A']:
            score += 2

        # ✅ Age-based
        if age_months > 120:  # > 10 years
            score += 2
        elif age_months > 84:  # > 7 years
            score += 1

        # ✅ Weight-based
        if weight > 0:
            if weight > 30 and row.get('pet_type') == 'Dog':
                score += 1
            elif weight > 8 and row.get('pet_type') == 'Cat':
                score += 1

        # ✅ Medical record count
        if medical_record_count >= 5:
            score += 2
        elif medical_record_count >= 2:
            score += 1

        if score >= 5:
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
        
        try:
            X = X.astype(float)
        except (ValueError, TypeError) as e:
            print(f"Error converting features to float: {e}")
            self.is_trained = False
            return False

        for target_name, y_values in y_dict.items():
            unique_classes = np.unique(y_values)
            if len(unique_classes) < 2:
                print(f"Not enough variety for {target_name}. Skipping.")
                continue

            X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(
                X, y_values, test_size=0.2, random_state=42
            )

            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            model.fit(X_train_t, y_train_t)

            y_pred = model.predict(X_test_t)
            accuracy = accuracy_score(y_test_t, y_pred)
            print(f"<i class='fas fa-check-circle'></i> {target_name} model accuracy: {accuracy:.2f}")

            self.models[target_name] = model
            self._save_model(target_name, model)

        self.is_trained = True
        return True

    def _save_model(self, name, model):
        """Save model to disk"""
        with open(f"{MODEL_PATH}{name}_model.pkl", 'wb') as f:
            pickle.dump(model, f)

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
        if not self.is_trained:
            if not self._load_models():
                return self._get_default_recommendations(pet_data)

        try:
            features = self._preprocess_single_pet(pet_data)

            if features is None:
                return self._get_default_recommendations(pet_data)

            predictions = {}
            for name, model in self.models.items():
                try:
                    pred = model.predict([features])[0]
                    predictions[name] = int(pred)
                except Exception as e:
                    print(f"Error predicting {name}: {e}")
                    predictions[name] = 1

            return self._generate_recommendations(pet_data, predictions)

        except Exception as e:
            print(f"Error in prediction: {e}")
            return self._get_default_recommendations(pet_data)

    def _preprocess_single_pet(self, pet_data):
        """Preprocess a single pet's data for prediction"""
        try:
            breed = pet_data.get('breed', 'Unknown') or 'Unknown'
            medical_history = pet_data.get('medical_history', 'None') or 'None'
            allergies = pet_data.get('allergies', 'None') or 'None'
            gender = pet_data.get('gender', 'Unknown') or 'Unknown'
            
            age = safe_float(pet_data.get('age', 0), 0.0)
            age_months = safe_int(pet_data.get('age_months', 0), 0)
            weight = safe_float(pet_data.get('weight', 0), 0.0)
            pet_type = pet_data.get('pet_type', 'Dog') or 'Dog'
            vaccine_count = safe_int(pet_data.get('vaccine_count', 0), 0)
            appointment_count = safe_int(pet_data.get('appointment_count', 0), 0)
            medical_record_count = safe_int(pet_data.get('medical_record_count', 0), 0)

            age_in_months = (age * 12) + age_months

            # ✅ Calculate medical severity
            medical_severity = self._calculate_medical_severity({
                'medical_history': medical_history,
                'medical_history_details': pet_data.get('medical_history_details', '{}')
            })

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

            features = [
                age_in_months,
                weight,
                encoded_features[0],
                encoded_features[1],
                encoded_features[2],
                encoded_features[3],
                encoded_features[4],
                vaccine_count,
                appointment_count,
                medical_record_count,
                medical_severity
            ]

            return features

        except Exception as e:
            print(f"Error preprocessing pet: {e}")
            return None

    # ═══════════════════════════════════════════════════════════════════
    # ✅ UPDATED: _generate_recommendations() — kasama na ang medical records
    # ═══════════════════════════════════════════════════════════════════
    def _generate_recommendations(self, pet_data, predictions):
        """Generate human-readable recommendations based on predictions + medical history"""
        pet_name = pet_data.get('name', 'Your pet')
        age = pet_data.get('age', 0)
        breed = pet_data.get('breed', 'Unknown')
        pet_type = pet_data.get('pet_type', 'Dog')
        medical_history = pet_data.get('medical_history', '') or ''
        allergies = pet_data.get('allergies', '') or ''
        medical_record_count = safe_int(pet_data.get('medical_record_count', 0), 0)

        vaccine_levels = {0: 'Low', 1: 'Medium', 2: 'High'}
        grooming_levels = {0: 'Monthly', 1: 'Bi-weekly', 2: 'Weekly'}
        health_levels = {0: 'Low', 1: 'Medium', 2: 'High'}

        vaccine_priority = vaccine_levels.get(predictions.get('vaccine', 1), 'Medium')
        grooming_freq = grooming_levels.get(predictions.get('grooming', 1), 'Bi-weekly')
        health_risk = health_levels.get(predictions.get('health', 1), 'Medium')

        recommendations = []

        # ═══════════════════════════════════════════════════════════════
        # ✅ MEDICAL HISTORY-BASED RECOMMENDATIONS (PRIORITY)
        # ═══════════════════════════════════════════════════════════════
        if medical_history and medical_history not in ['', 'None', 'none', 'N/A']:
            med_lower = medical_history.lower()
            
            if any(cond in med_lower for cond in ['cancer', 'tumor', 'organ failure']):
                recommendations.append(
                    f"<i class='fas fa-exclamation-triangle' style='color:#ef4444;'></i> "
                    f"<strong>CRITICAL:</strong> {pet_name} has a serious medical condition. "
                    f"Schedule frequent vet visits and follow the prescribed treatment plan strictly."
                )
            
            if any(cond in med_lower for cond in ['heart', 'kidney', 'liver']):
                recommendations.append(
                    f"<i class='fas fa-heartbeat' style='color:#ef4444;'></i> "
                    f"{pet_name} has a history of organ-related condition. "
                    f"Regular check-ups every 3-6 months are strongly recommended."
                )
            
            if any(cond in med_lower for cond in ['diabetes', 'insulin']):
                recommendations.append(
                    f"<i class='fas fa-syringe' style='color:#f59e0b;'></i> "
                    f"{pet_name} has diabetes. Monitor blood sugar levels and maintain a consistent feeding schedule."
                )
            
            if any(cond in med_lower for cond in ['epilepsy', 'seizure']):
                recommendations.append(
                    f"<i class='fas fa-brain' style='color:#f59e0b;'></i> "
                    f"{pet_name} has a seizure disorder. Keep a seizure diary and avoid stressful situations."
                )
            
            if any(cond in med_lower for cond in ['arthritis', 'hip dysplasia', 'joint']):
                recommendations.append(
                    f"<i class='fas fa-bone' style='color:#f59e0b;'></i> "
                    f"{pet_name} has joint-related issues. Consider joint supplements and low-impact exercise."
                )
            
            if any(cond in med_lower for cond in ['skin', 'dermatitis', 'allergy']):
                recommendations.append(
                    f"<i class='fas fa-band-aid' style='color:#f59e0b;'></i> "
                    f"{pet_name} has a skin condition. Use medicated shampoo and avoid known irritants."
                )
            
            if any(cond in med_lower for cond in ['dental', 'gingivitis', 'stomatitis']):
                recommendations.append(
                    f"<i class='fas fa-tooth' style='color:#f59e0b;'></i> "
                    f"{pet_name} has dental issues. Regular teeth cleaning and dental check-ups are recommended."
                )
            
            if any(cond in med_lower for cond in ['ear infection', 'ear mite']):
                recommendations.append(
                    f"<i class='fas fa-ear-listen' style='color:#f59e0b;'></i> "
                    f"{pet_name} has a history of ear infections. Clean ears regularly and keep them dry."
                )
            
            # General medical history notice kung walang specific match
            if len(recommendations) == 0:
                recommendations.append(
                    f"<i class='fas fa-clipboard-list' style='color:#7ba05b;'></i> "
                    f"{pet_name} has medical history: {medical_history}. "
                    f"Monitor for recurrence and follow-up as needed."
                )

        # ═══════════════════════════════════════════════════════════════
        # ✅ MEDICAL RECORDS-BASED RECOMMENDATIONS
        # ═══════════════════════════════════════════════════════════════
        if medical_record_count > 0:
            if medical_record_count >= 5:
                recommendations.append(
                    f"<i class='fas fa-notes-medical' style='color:#ef4444;'></i> "
                    f"{pet_name} has <strong>{medical_record_count} medical records</strong>. "
                    f"Consider a comprehensive health assessment to review ongoing conditions."
                )
            elif medical_record_count >= 2:
                recommendations.append(
                    f"<i class='fas fa-notes-medical' style='color:#f59e0b;'></i> "
                    f"{pet_name} has <strong>{medical_record_count} medical records</strong>. "
                    f"Regular follow-up visits are recommended."
                )
            else:
                recommendations.append(
                    f"<i class='fas fa-notes-medical' style='color:#7ba05b;'></i> "
                    f"{pet_name} has <strong>{medical_record_count} medical record</strong>. "
                    f"Continue monitoring and attend scheduled check-ups."
                )

        # ═══════════════════════════════════════════════════════════════
        # ✅ VACCINE PRIORITY
        # ═══════════════════════════════════════════════════════════════
        if vaccine_priority == 'High':
            recommendations.append(f"<i class='fas fa-circle' style='color:#ef4444;'></i> {pet_name} has HIGH vaccination priority. Schedule core vaccines immediately.")
        elif vaccine_priority == 'Medium':
            recommendations.append(f"<i class='fas fa-circle' style='color:#f59e0b;'></i> {pet_name} has MEDIUM vaccination priority. Ensure vaccines are up to date.")
        else:
            recommendations.append(f"<i class='fas fa-circle' style='color:#10b981;'></i> {pet_name} has LOW vaccination priority. Follow standard vaccination schedule.")

        # ═══════════════════════════════════════════════════════════════
        # ✅ GROOMING
        # ═══════════════════════════════════════════════════════════════
        if grooming_freq == 'Weekly':
            recommendations.append(f"<i class='fas fa-scissors'></i> {pet_name} needs WEEKLY grooming due to breed and coat type.")
        elif grooming_freq == 'Bi-weekly':
            recommendations.append(f"<i class='fas fa-scissors'></i> {pet_name} needs BI-WEEKLY grooming for optimal coat health.")
        else:
            recommendations.append(f"<i class='fas fa-scissors'></i> {pet_name} needs MONTHLY grooming for basic care.")

        # ═══════════════════════════════════════════════════════════════
        # ✅ HEALTH RISK
        # ═══════════════════════════════════════════════════════════════
        if health_risk == 'High':
            recommendations.append(f"<i class='fas fa-exclamation-triangle'></i> {pet_name} has HIGH health risk. Schedule a comprehensive health check-up immediately.")
        elif health_risk == 'Medium':
            recommendations.append(f"<i class='fas fa-info-circle'></i> {pet_name} has MEDIUM health risk. Regular monitoring recommended.")
        else:
            recommendations.append(f"<i class='fas fa-check-circle'></i> {pet_name} has LOW health risk. Maintain current care routine.")

        # ═══════════════════════════════════════════════════════════════
        # ✅ BREED-SPECIFIC
        # ═══════════════════════════════════════════════════════════════
        breed_specific = self._get_breed_specific_recommendations(breed, pet_type)
        if breed_specific:
            recommendations.append(breed_specific)

        # ═══════════════════════════════════════════════════════════════
        # ✅ AGE-SPECIFIC
        # ═══════════════════════════════════════════════════════════════
        age_int = safe_int(age, 0)
        if age_int > 10:
            recommendations.append(f"<i class='fas fa-user-clock'></i> {pet_name} is a senior pet ({age} years). Consider senior-specific care and more frequent check-ups.")
        elif age_int < 1 and age_int > 0:
            recommendations.append(f"<i class='fas fa-paw'></i> {pet_name} is a puppy/kitten ({age} years). Follow the accelerated vaccination and socialization schedule.")

        # ═══════════════════════════════════════════════════════════════
        # ✅ ALLERGIES
        # ═══════════════════════════════════════════════════════════════
        if allergies and allergies not in ['', 'None', 'none', 'N/A']:
            recommendations.append(f"<i class='fas fa-exclamation-triangle'></i> {pet_name} has allergies: {allergies}. Avoid triggers and consider allergy management plan.")

        return {
            'pet_name': pet_name,
            'vaccine_priority': vaccine_priority,
            'grooming_frequency': grooming_freq,
            'health_risk': health_risk,
            'recommendations': recommendations,
            'medical_history': medical_history,
            'medical_record_count': medical_record_count,
            'prediction_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    def _get_breed_specific_recommendations(self, breed, pet_type):
        """Get breed-specific care recommendations"""
        if not breed:
            return None

        breed_lower = breed.lower()

        if pet_type == 'Dog':
            if 'labrador' in breed_lower or 'golden' in breed_lower:
                return "<i class='fas fa-dog'></i> Labrador/Golden Retrievers are prone to hip dysplasia. Recommended: Joint supplements and regular exercise."
            elif 'poodle' in breed_lower:
                return "<i class='fas fa-dog'></i> Poodles need regular ear cleaning and professional grooming every 4-6 weeks."
            elif 'bulldog' in breed_lower:
                return "<i class='fas fa-dog'></i> Bulldogs are brachycephalic. Avoid strenuous exercise in hot weather and keep them at healthy weight."
            elif 'german shepherd' in breed_lower:
                return "<i class='fas fa-dog'></i> German Shepherds need mental stimulation and may benefit from hip/elbow screening."
            elif 'shih tzu' in breed_lower or 'maltese' in breed_lower:
                return "<i class='fas fa-dog'></i> Small breeds like Shih Tzu need daily eye cleaning and regular dental care."

        elif pet_type == 'Cat':
            if 'persian' in breed_lower:
                return "<i class='fas fa-cat'></i> Persians need daily eye cleaning and regular brushing to prevent matting."
            elif 'siamese' in breed_lower:
                return "<i class='fas fa-cat'></i> Siamese are vocal and social. Provide plenty of interaction and environmental enrichment."
            elif 'maine coon' in breed_lower:
                return "<i class='fas fa-cat'></i> Maine Coons need regular grooming and are prone to hip dysplasia and heart conditions."

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
                f"<i class='fas fa-info-circle'></i> {pet_name}: Follow standard pet care guidelines.",
                f"<i class='fas fa-calendar-alt'></i> Schedule regular vaccination and wellness visits.",
                f"<i class='fas fa-scissors'></i> Maintain regular grooming routine."
            ],
            'medical_history': pet_data.get('medical_history', ''),
            'medical_record_count': 0,
            'prediction_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }


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