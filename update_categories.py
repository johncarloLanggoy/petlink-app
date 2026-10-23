import sqlite3
conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# Gawing 'vet_disease' yung mga specific na sakit
c.execute("""
    UPDATE services 
    SET service_category = 'vet_disease' 
    WHERE name LIKE '%Canine%' 
       OR name LIKE '%Feline%' 
       OR name LIKE '%Leptospirosis%' 
       OR name LIKE '%Kennel Cough%'
""")

conn.commit()
conn.close()
print('✅ Matagumpay na naihiwalay ang mga Disease Treatments!')
