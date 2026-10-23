import sqlite3

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# I-update ang mga Canine (Dog)
c.execute("UPDATE services SET name = name || ' (Dog)' WHERE service_category = 'vet_disease' AND name LIKE '%Canine%' AND name NOT LIKE '%(Dog)%'")

# I-update ang mga Feline (Cat)
c.execute("UPDATE services SET name = name || ' (Cat)' WHERE service_category = 'vet_disease' AND name LIKE '%Feline%' AND name NOT LIKE '%(Cat)%'")

conn.commit()
conn.close()
print('✅ Matagumpay na nadagdagan ng (Dog) at (Cat) ang mga Disease Treatments!')
