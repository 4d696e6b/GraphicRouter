import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const items=JSON.parse(readFileSync(new URL('../src/design-skills/library.json',import.meta.url),'utf8'));
for(const item of items){
  const dir=new URL(`../skills/${item.id}/`,import.meta.url);mkdirSync(dir,{recursive:true});
  writeFileSync(new URL('SKILL.md',dir),`---\nname: ${item.id}\ndescription: ${JSON.stringify(item.description)}\n---\n\n# ${item.title}\n\n${item.instructions}\n\n## Reference compositions\n\nRead [examples.json](examples.json) for concrete requests, composition decisions and failure cases. These are illustrative design studies, not verified user facts or performance evidence.\n`);
  writeFileSync(new URL('examples.json',dir),JSON.stringify(item.examples,null,2)+'\n');
}
