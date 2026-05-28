exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price NUMERIC NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_bookings (
      id SERIAL PRIMARY KEY,
      patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      amount_paid NUMERIC NOT NULL,
      status VARCHAR(50) DEFAULT 'Confirmed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS service_bookings CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
  `);
};
