const fs = require("node:fs/promises");
const path = require("node:path");

const VALID_FILES = [".ts", ".tsx"];

const DIRECTORY_MAP = {
  ".d.ts": "types/source/main",
  ".mjs": "es6/source/main",
  ".cjs": "cjs/source/main",
};

const CONTENT_MAP = {
  ".d.ts": 'export * from "{{path}}"',
  ".mjs": 'export * from "{{path}}"',
  ".cjs": 'module.exports = require("{{path}}")',
};

const actualDir = path.resolve(__dirname, "../");

const mainDir = path.resolve(actualDir, "source/main");

const absoluteBuildPath = path.resolve(actualDir, "_build");

const absoluteDistPath = path.resolve(actualDir, "core");

const packagePath = path.resolve(actualDir, "package.json");

async function generateDist(distPath) {
  try {
    await fs.access(distPath);
  } catch (error) {
    await fs.mkdir(distPath);
  }
}

function generateContent(ext, newPath) {
  return CONTENT_MAP[ext].replace(/{{(.*?)}}/g, (_, parameter) => {
    if (parameter === "path") return newPath;
    return "";
  });
}

async function generateFiles(fileName, distDir, buildDir) {
  const filesToGenerate = Object.entries(DIRECTORY_MAP);

  const relativePath = path.relative(distDir, absoluteBuildPath);

  for await (const [ext, dir] of filesToGenerate) {
    await fs.writeFile(
      path.resolve(distDir, `${fileName}${ext}`),
      generateContent(ext, path.join(relativePath, dir, buildDir)),
    );
  }
}

async function generateEntries(currentDir, dist, buildDir = "") {
  const resources = await fs.readdir(currentDir);

  for await (const resource of resources) {
    const itemPath = path.resolve(currentDir, resource);

    const stats = await fs.stat(itemPath);

    if (stats.isFile()) {
      const file = path.parse(itemPath);

      if (!VALID_FILES.includes(file.ext)) return;

      await generateFiles(file.name, dist, buildDir);
    }

    if (stats.isDirectory()) {
      const subDist = path.resolve(dist, resource);
      await fs.mkdir(subDist);
      await generateEntries(itemPath, subDist, resource);
    }
  }
}

async function getFilesToPublish() {
  const fileList = new Set();

  const files = await fs.readdir(absoluteDistPath, { recursive: true });

  for await (const item of files) {
    const filePath = path.resolve(absoluteDistPath, item);

    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      const relativePath = path.relative(actualDir, filePath);

      fileList.add(relativePath);
    }
  }

  return fileList;
}

async function appendFilesToPackage(files) {
  const fileList = new Set(files);

  const packageFile = await fs.readFile(packagePath, "utf-8");

  const packageJson = JSON.parse(packageFile);

  if (!Array.isArray(packageJson.files)) {
    packageJson.files = [];
  }

  const packageJsonFiles = new Set([]);

  for (const filePath of fileList) {
    if (!packageJsonFiles.has(filePath)) {
      packageJsonFiles.add(filePath);
    }
  }

  packageJson.files = Array.from(packageJsonFiles);

  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
}

async function main() {
  await fs.rm(absoluteDistPath, { recursive: true, force: true });

  await generateDist(absoluteDistPath);

  await generateEntries(mainDir, absoluteDistPath);
}

main();
