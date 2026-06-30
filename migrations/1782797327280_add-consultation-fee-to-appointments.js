exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC;

    -- Backfill existing appointments with the current consultation fee of the doctor
    UPDATE appointments a
    SET consultation_fee = (
      SELECT dp.consultation_fee
      FROM doctor_profiles dp
      WHERE dp.doctor_id = a.doctor_id
    )
    WHERE a.consultation_fee IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE appointments 
    DROP COLUMN IF EXISTS consultation_fee;
  `);
};
