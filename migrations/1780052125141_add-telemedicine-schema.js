exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('appointments', {
    is_telemedicine: { type: 'boolean', default: false }
  });

  pgm.addColumn('services', {
    is_default: { type: 'boolean', default: false }
  });

  pgm.sql(`
    INSERT INTO services (name, price, is_available, is_default)
    SELECT 'Telemedicine', 2500, true, true
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Telemedicine');
  `);
};

exports.down = (pgm) => {
  pgm.dropColumn('appointments', 'is_telemedicine');
  pgm.dropColumn('services', 'is_default');
};
