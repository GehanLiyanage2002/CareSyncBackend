const currentTasks = {
  '1': { raw_date: 'Mon Jun 01 2026 00:00:00 GMT+0530', raw_time: '09:00:00' },
  '2': { raw_date: 'Mon Jun 01 2026 00:00:00 GMT+0530', raw_time: '08:45:00' },
  '3': { raw_date: 'Mon Jun 01 2026 00:00:00 GMT+0530', raw_time: '09:15:00' }
};

const taskIds = ['1', '2', '3'];

const sortTaskIdsChronologically = (taskIdsToUpdate, currentTasks) => {
  return [...taskIdsToUpdate].sort((aId, bId) => {
    const a = currentTasks[aId];
    const b = currentTasks[bId];
    const dateA = new Date(a.raw_date).getTime();
    const dateB = new Date(b.raw_date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.raw_time.localeCompare(b.raw_time);
  });
};

console.log(sortTaskIdsChronologically(taskIds, currentTasks));

