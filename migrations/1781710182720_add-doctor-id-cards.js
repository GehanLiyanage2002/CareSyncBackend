/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.addColumn('doctor_profiles', {
    id_card_front: { type: 'bytea' },
    id_card_front_mimetype: { type: 'varchar(255)' },
    id_card_rear: { type: 'bytea' },
    id_card_rear_mimetype: { type: 'varchar(255)' }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumn('doctor_profiles', ['id_card_front', 'id_card_front_mimetype', 'id_card_rear', 'id_card_rear_mimetype']);
};
