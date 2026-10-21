const fs = require('fs');
let text = fs.readFileSync('dashboard.html', 'utf8');

const find1 = "return (grants[perm] || []).includes(role);\r\n}";
const rep1 = `let allowed = (grants[perm] || []).includes(role);
  if (window.userModulePerms) {
     const pPerm = window.userModulePerms.find(x => x.module === 'projects');
     if (pPerm) {
       if (perm === 'create_project' && pPerm.can_create) allowed = true;
       if (perm === 'import_project' && pPerm.can_create) allowed = true;
     }
  }
  return allowed;
}`;

const find2 = "year:'numeric' });\r\n\r\n  applyPermissions(role);";
const rep2 = `year:'numeric' });

  const { data: modPerms } = await sb.from('user_module_permissions').select('*').eq('profile_id', session.user.id);
  window.userModulePerms = modPerms || [];

  applyPermissions(role);`;

text = text.replace(find1, rep1);
text = text.replace(find2, rep2);

fs.writeFileSync('dashboard.html', text, 'utf8');
console.log('Fixed dashboard.html!');
