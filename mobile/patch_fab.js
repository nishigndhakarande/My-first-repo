const fs = require('fs');
let content = fs.readFileSync('src/screens/ScheduleScreen.js', 'utf8');
content = content.replace(
  /<TouchableOpacity style=\{styles\.fab\}[\s\S]*?<\/TouchableOpacity>/,
  
      <TaskFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchSchedule()}
        onDelete={() => fetchSchedule()}
        initialData={editingTask}
        activeProjectId={activeProject?.id}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingTask(null); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
  
);
fs.writeFileSync('src/screens/ScheduleScreen.js', content, 'utf8');
