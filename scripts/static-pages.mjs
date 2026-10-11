import {mkdir,readFile,writeFile} from "node:fs/promises";
const html=await readFile("dist/client/index.html","utf8");
for(const page of ["chat","admin"]) { await mkdir(`dist/client/${page}`,{recursive:true});await writeFile(`dist/client/${page}/index.html`,html); }
await writeFile("dist/client/.nojekyll","");
