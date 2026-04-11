const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function resolvePortfolioItemsPath() {
  const candidates = [
    process.env.PORTFOLIO_ITEMS_PATH,
    path.resolve(__dirname, '../../Frontend/src/data/portfolioItems.js'),
    path.resolve(__dirname, '../../src/data/portfolioItems.js'),
  ].filter(Boolean);

  const existingPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!existingPath) {
    throw new Error(
      `Could not find portfolioItems.js. Checked:\n${candidates.join('\n')}`,
    );
  }

  return existingPath;
}

function loadPortfolioItems() {
  const sourcePath = resolvePortfolioItemsPath();
  const source = fs.readFileSync(sourcePath, 'utf8');
  const transformed = source.replace(
    /export default portfolioItems;\s*$/,
    'module.exports = portfolioItems;',
  );

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    console,
  };

  vm.runInNewContext(transformed, sandbox, { filename: sourcePath });

  return sandbox.module.exports;
}

async function main() {
  const portfolioItems = loadPortfolioItems();

  const projects = portfolioItems.map((item, index) => ({
    sortOrder: index,
    date: item.date,
    title: item.title,
    imageSrc: '',
    videoEmbedCode: '',
    description: item?.desc?.ru ?? '',
  }));

  await prisma.project.deleteMany();

  if (projects.length > 0) {
    await prisma.project.createMany({
      data: projects,
    });
  }

  console.log(`Seeded ${projects.length} projects`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
