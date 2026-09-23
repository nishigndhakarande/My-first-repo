const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace FABs
  const fabRegex = /<TouchableOpacity style=\{styles\.fab\} activeOpacity=\{0\.8\}>/g;
  if (fabRegex.test(content)) {
    content = content.replace(fabRegex, "<TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => Alert.alert('Notice', 'Data entry forms are coming in the next mobile update.')}>");
    changed = true;
  }

  // Replace editBtn
  const editBtnRegex = /<TouchableOpacity style=\{styles\.editBtn\}>/g;
  if (editBtnRegex.test(content)) {
    content = content.replace(editBtnRegex, "<TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('Notice', 'Data entry forms are coming in the next mobile update.')}>");
    changed = true;
  }

  // Quality Screen actionBtn (for editing)
  if (file === 'QualityScreen.js') {
    const actBtnRegex = /<TouchableOpacity style=\{styles\.actionBtn\}>/g;
    if (actBtnRegex.test(content)) {
      content = content.replace(actBtnRegex, "<TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Notice', 'Data entry forms are coming in the next mobile update.')}>");
      changed = true;
    }
  }

  // Admin Screen actionBtn (for Edit Role)
  if (file === 'AdminScreen.js') {
    const actBtnRegex = /<TouchableOpacity style=\{styles\.actionBtn\}>/g;
    if (actBtnRegex.test(content)) {
      content = content.replace(actBtnRegex, "<TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Notice', 'Data entry forms are coming in the next mobile update.')}>");
      changed = true;
    }
  }

  // Client Portal contactBtn
  if (file === 'ClientPortalScreen.js') {
    const contactBtnRegex = /<TouchableOpacity style=\{styles\.contactBtn\}>/g;
    if (contactBtnRegex.test(content)) {
      content = content.replace(contactBtnRegex, "<TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Notice', 'Messaging features are coming in the next mobile update.')}>");
      changed = true;
    }
  }

  if (changed) {
    // Add Alert import if not present
    if (!content.includes('Alert.alert') && !content.includes('Alert,')) {
      content = content.replace(/import \{([^}]*)\} from 'react-native';/, "import {  Alert,\n} from 'react-native';");
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});
