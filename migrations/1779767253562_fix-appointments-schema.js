exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    DO $$ 
    BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_time') THEN
            ALTER TABLE appointments RENAME COLUMN appointment_time TO start_time;
        END IF;

        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_age') THEN
            ALTER TABLE appointments RENAME COLUMN patient_age TO age;
        END IF;

        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_gender') THEN
            ALTER TABLE appointments RENAME COLUMN patient_gender TO gender;
        END IF;

        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_contact') THEN
            ALTER TABLE appointments RENAME COLUMN patient_contact TO mobile_number;
        END IF;
    END $$;

    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

    ALTER TABLE appointments ALTER COLUMN token_number TYPE VARCHAR(50) USING token_number::VARCHAR;
    
    -- If casting fails due to invalid time formats in text, we might need a safer approach, 
    -- but usually 'HH:MM' can be cast to TIME easily.
    ALTER TABLE appointments ALTER COLUMN start_time TYPE TIME USING start_time::TIME;
  `);
};

exports.down = (pgm) => {
  // No-op for this fix
};
