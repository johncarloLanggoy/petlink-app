import sqlite3

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# Listahan ng mga Dog services
dog_services = [
    'Canine Distemper',
    'Canine Parvovirus',
    'Infectious Canine Hepatitis',
    'Leptospirosis',
    'Kennel Cough'
]

# Listahan ng mga Cat services
cat_services = [
    'Feline Panleukopenia',
    'Feline Leukemia Virus (FeLV)',
    'Feline Infectious Peritonitis (FIP)',
    'Feline Upper Respiratory Infection',
    'Feline Calicivirus Infection'
]

# I-update ang Dog services
for name in dog_services:
    c.execute("UPDATE services SET name = ? WHERE name = ?", (f"{name} (Dog)", name))

# I-update ang Cat services
for name in cat_services:
    c.execute("UPDATE services SET name = ? WHERE name = ?", (f"{name} (Cat)", name))

conn.commit()
conn.close()
print('✅ Matagumpay na nadagdagan ng (Dog) at (Cat) ang mga pangalan!')
