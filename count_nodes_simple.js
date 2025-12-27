
const fs = require('fs');
try {
    const content = fs.readFileSync('src/data/buildingData.js', 'utf8');
    const nodesJson = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
    // Rough estimate by counting strings
    const lifts = (content.match(/\"type\":\s*\"lift\"/g) || []).length;
    const classrooms = (content.match(/\"type\":\s*\"classroom\"/g) || []).length;
    const labs = (content.match(/\"type\":\s*\"lab\"/g) || []).length;
    const offices = (content.match(/\"type\":\s*\"office\"/g) || []).length;
    const washrooms = (content.match(/\"type\":\s*\"washroom/g) || []).length;

    console.log(JSON.stringify({ lifts, classrooms, labs, offices, washrooms }));
} catch (e) {
    console.log('Error:', e.message);
}
