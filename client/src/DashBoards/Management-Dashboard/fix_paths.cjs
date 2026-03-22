const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./Pages');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import paths that changed depth
  // 'import ... from "../../../../..."' becomes 'import ... from "../../../..."'
  content = content.replace(/([\"'])\.\.\/\.\.\/\.\.\/\.\.\//g, '$1../../../');
  
  // 'import ... from "../../components/..."' becomes 'import ... from "../components/..."'
  content = content.replace(/([\"'])\.\.\/\.\.\/components/g, '$1../components');
  
  // Any other '../../' that isn't the start of a CSS or layout we can just be careful with
  // the CSS file was: '../ManagementDashboard.css'. It should remain exactly that from Pages/*.jsx
  // So we only replace 4x and the 2x ones that pointed to components! What about '../../assets'?
  content = content.replace(/([\"'])\.\.\/\.\.\/assets/g, '$1../assets');
  
  // What about '../../../../assets'?
  // Oh wait, if it was 4 deep, we already turned it to 3 deep above!
  
  // Are there any other imports starting with '../../'?
  // Like '../../context/...'?
  content = content.replace(/([\"'])\.\.\/\.\.\/\.\.\/\.\.\/context/g, '$1../../../context');
  // wait we already replaced 4x with 3x above, so it would just be:
  // content is already changed.
  
  fs.writeFileSync(file, content);
});

console.log('Paths modified correctly');
