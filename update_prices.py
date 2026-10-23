import sqlite3

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# 1. Staff Services (Grooming)
staff_prices = {
    'Bath & Brush': 350.00,
    'Nail Trim': 150.00,
    'Ear Cleaning': 200.00,
    'Teeth Cleaning': 300.00,
    'Flea & Tick Treatment': 450.00,
    'De-shedding': 500.00,
    'Full Grooming': 700.00,
    'Creative Styling': 1000.00
}
for name, price in staff_prices.items():
    c.execute("UPDATE services SET price = ? WHERE name = ?", (price, name))

# 2. General Vet Services
general_prices = {
    'General Checkup': 500.00,
    'Sick Pet Consultation': 600.00,
    'Deworming': 300.00,
    'Wound Treatment': 400.00,
    'Vaccination': 800.00
}
for name, price in general_prices.items():
    c.execute("UPDATE services SET price = ? WHERE name = ?", (price, name))

# 3. Disease Treatments (Dog)
c.execute("UPDATE services SET price = 1500.00 WHERE name LIKE '%Canine Distemper%' AND name NOT LIKE '%Neurological%' AND name NOT LIKE '%Severe%' AND name NOT LIKE '%Gastrointestinal%' AND name NOT LIKE '%Pneumonia%'")
c.execute("UPDATE services SET price = 1800.00 WHERE name LIKE '%Gastrointestinal%' OR name LIKE '%Secondary Pneumonia%'")
c.execute("UPDATE services SET price = 2500.00 WHERE name LIKE '%Neurological%' OR name LIKE '%Severe Canine%'")

# 4. Disease Treatments (Cat)
c.execute("UPDATE services SET price = 1800.00 WHERE name LIKE '%Dehydration%' OR name LIKE '%Secondary Infection%'")
c.execute("UPDATE services SET price = 2500.00 WHERE name LIKE '%Sepsis%' OR name LIKE '%Severe Feline%'")
c.execute("UPDATE services SET price = 1600.00 WHERE name LIKE '%Neonatal Kittens%'")

conn.commit()
conn.close()
print('✅ Matagumpay na na-update ang lahat ng presyo base sa Pet Express!')
