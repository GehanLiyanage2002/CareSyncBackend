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
  // Add new fields to services
  pgm.addColumns('services', {
    description: { type: 'text' },
    location: { type: 'varchar(255)' }
  });

  // Create service_schedules table
  pgm.createTable('service_schedules', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    service_id: {
      type: 'integer',
      references: '"services"',
      onDelete: 'CASCADE'
    },
    schedule_date: { type: 'date', notNull: true },
    start_time: { type: 'time', notNull: true },
    end_time: { type: 'time', notNull: true },
    slot_duration_minutes: { type: 'integer', notNull: true }
  });

  // Add unique constraint so a service can't have duplicate schedules on the same day
  pgm.addConstraint('service_schedules', 'service_schedules_service_id_schedule_date_key', {
    unique: ['service_id', 'schedule_date']
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('service_schedules');
  pgm.dropColumns('services', ['description', 'location']);
};
