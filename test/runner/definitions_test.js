const fs = require('fs');
const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const chai = require('chai');
const chaiSubset = require('chai-subset');
const { Project, StructureKind, ts } = require('ts-morph');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/definitions');
const pathToRootOfProject = path.join(__dirname, '../../');
const pathOfStaticDefinitions = path.join(pathToRootOfProject, 'typings/index.d.ts');
const pathOfJSDocDefinitions = path.join(pathToRootOfProject, 'typings/types.d.ts');
const pathToTests = path.resolve(pathToRootOfProject, 'test');
const pathToTypings = path.resolve(pathToRootOfProject, 'typings');

chai.use(chaiSubset);

describe('Definitions', function () {
  this.timeout(20000);
  this.retries(4);
  before(() => {
    execSync(path.join(pathToRootOfProject, 'runio.js def'));
  })
  afterEach(() => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
      fs.unlinkSync(`${codecept_dir}/../../steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
  });

  describe('Static files', () => {
    it('should have internal object that is available as variable codeceptjs', (done) => {
      exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
        const types = typesFrom(`${codecept_dir}/steps.d.ts`);
        types.should.be.valid;

        const definitionsFile = types.getSourceFileOrThrow(pathOfJSDocDefinitions);
        const index = definitionsFile.getNamespaceOrThrow('CodeceptJS').getNamespaceOrThrow('index').getStructure();
        index.statements.should.containSubset([
          { declarations: [{ name: 'recorder', type: 'CodeceptJS.recorder' }] },
          { declarations: [{ name: 'event', type: 'typeof CodeceptJS.event' }] },
          { declarations: [{ name: 'output', type: 'typeof CodeceptJS.output' }] },
          { declarations: [{ name: 'config', type: 'typeof CodeceptJS.Config' }] },
          { declarations: [{ name: 'container', type: 'typeof CodeceptJS.Container' }] },
        ]);
        const codeceptjs = types.getSourceFileOrThrow(pathOfStaticDefinitions).getVariableDeclarationOrThrow('codeceptjs').getStructure();
        codeceptjs.type.should.equal('typeof CodeceptJS.index');
        done();
      });
    });
  });

  it('def should create definition file', (done) => {
    exec(`${runner} def ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionFile = types.getSourceFileOrThrow(`${codecept_dir}/steps.d.ts`);
      const extend = getExtends(definitionFile.getNamespaceOrThrow('CodeceptJS').getInterfaceOrThrow('I'));
      extend.should.containSubset([{
        methods: [{
          name: 'amInPath',
          returnType: 'void',
          parameters: [{ name: 'openPath', type: 'string' }],
        }, {
          name: 'seeFile',
          returnType: 'void',
          parameters: [{ name: 'name', type: 'string' }],
        }],
      }]);
      assert(!err);
      done();
    });
  });

  it('def should create definition file with correct page def', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, (err, stdout) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionFile = types.getSourceFileOrThrow(`${codecept_dir}/steps.d.ts`);
      const extend = definitionFile.getFullText();

      extend.should.include("type CurrentPage = typeof import('./po/custom_steps.js');");
      assert(!err);
      done();
    });
  });

  it('def should create definition file given a config file', (done) => {
    exec(`${runner} def --config ${codecept_dir}/../../codecept.ddt.json`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      const types = typesFrom(`${codecept_dir}/../../steps.d.ts`);
      types.should.be.valid;
      assert(!err);
      done();
    });
  });

  it('def should create definition file with support object', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionsFile = types.getSourceFileOrThrow(`${codecept_dir}/steps.d.ts`);
      const MyPage = getAliasStructure(definitionsFile.getTypeAliasOrThrow('MyPage'));
      MyPage.properties.should.containSubset([{
        name: 'hasFile',
        returnType: undefined,
        kind: StructureKind.Method,
      }]);
      const I = getExtends(definitionsFile.getNamespaceOrThrow('CodeceptJS').getInterfaceOrThrow('I'));
      I.should.containSubset([{
        methods: [{
          name: 'openDir',
          returnType: undefined,
          kind: StructureKind.Method,
        }],
      }]);
      done();
    });
  });

  it('def should create definition file with inject which contains support objects', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionsFile = types.getSourceFileOrThrow(pathOfStaticDefinitions);
      const returned = getReturnStructure(definitionsFile.getFunctionOrThrow('inject'));
      returned.should.containSubset([{
        properties: [
          { name: 'SecondPage', type: 'SecondPage' },
          { name: 'MyPage', type: 'MyPage' },
        ],
      }]);
      done();
    });
  });

  it('def should create definition file with inject which contains I object', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, (err, stdout, stderr) => {
      assert(!err);
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionsFile = types.getSourceFileOrThrow(pathOfStaticDefinitions);
      const returned = getReturnStructure(definitionsFile.getFunctionOrThrow('inject'));
      returned.should.containSubset([
        {
          properties: [
            { name: 'I', type: 'CodeceptJS.I' },
            { name: 'MyPage', type: 'MyPage' },
          ],
        },
      ]);
      done();
    });
  });

  it('def should create definition file with inject which contains I object from helpers', (done) => {
    exec(`${runner} def --config ${codecept_dir}//codecept.inject.powi.json`, () => {
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionsFile = types.getSourceFileOrThrow(pathOfStaticDefinitions);
      const returned = getReturnStructure(definitionsFile.getFunctionOrThrow('inject'));
      returned.should.containSubset([{
        properties: [{ name: 'I', type: 'CodeceptJS.I' }],
      }]);
      done();
    });
  });

  it('def should create definition file with callback params', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const types = typesFrom(`${codecept_dir}/steps.d.ts`);
      types.should.be.valid;

      const definitionsFile = types.getSourceFileOrThrow(`${codecept_dir}/steps.d.ts`);
      const CallbackOrder = definitionsFile.getNamespaceOrThrow('CodeceptJS').getInterfaceOrThrow('CallbackOrder').getStructure();
      CallbackOrder.properties.should.containSubset([
        { name: '[0]', type: 'CodeceptJS.I' },
        { name: '[1]', type: 'MyPage' },
        { name: '[2]', type: 'SecondPage' },
      ]);
      done();
    });
  });
});

/** @type {Chai.ChaiPlugin */
chai.use((chai, utils) => {
  utils.addProperty(chai.Assertion.prototype, 'valid', function () {
    /** @type {import('ts-morph').Project} */
    const project = utils.flag(this, 'object');
    new chai.Assertion(project).to.be.instanceof(Project);

    let diagnostics = project.getPreEmitDiagnostics();
    diagnostics = diagnostics.filter((diagnostic) => {
      const filePath = diagnostic.getSourceFile().getFilePath();
      return filePath.startsWith(pathToTests) || filePath.startsWith(pathToTypings);
    });
    if (diagnostics.length > 0) throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics));
  });
});


/**
 * Resolves 'codeceptjs' type directive to the internal file,
 * and add resolves other files as normal.
 * @type {import('ts-morph').ResolutionHostFactory}
 */
function resolutionHost(moduleResolutionHost, getCompilerOptions) {
  const packageJson = require('../../package.json');
  return {
    resolveTypeReferenceDirectives: (typeDirectiveNames, containingFile) => {
      const compilerOptions = getCompilerOptions();
      const resolvedTypeReferenceDirectives = [];
      let result;

      for (const typeDirectiveName of typeDirectiveNames) {
        if (typeDirectiveName === 'codeceptjs') {
          result = {
            resolvedTypeReferenceDirective: {
              primary: false,
              resolvedFileName: path.join(pathToRootOfProject, 'typings/index.d.ts'),
              packageId: {
                name: packageJson.name,
                subModuleName: packageJson.typings,
                version: packageJson.version,
              },
              isExternalLibraryImport: true,
            },
            failedLookupLocations: [],
          };
        } else {
          result = ts.resolveTypeReferenceDirective(typeDirectiveName, containingFile, compilerOptions, moduleResolutionHost);
        }
        if (result.resolvedTypeReferenceDirective) { resolvedTypeReferenceDirectives.push(result.resolvedTypeReferenceDirective); }
      }

      return resolvedTypeReferenceDirectives;
    },
  };
}

/**
 * @param {string} sourceFile
 */
function typesFrom(sourceFile) {
  const project = new Project({
    tsConfigFilePath: path.join(pathToRootOfProject, 'tsconfig.json'),
    resolutionHost,
  });
  project.addExistingSourceFile(sourceFile);
  project.resolveSourceFileDependencies();
  return project;
}

/**
 * @param {import('ts-morph').Node} node
*/
function getExtends(node) {
  return node.getExtends().map((symbol) => {
    const result = {};
    /** @type {import('ts-morph').Type} */
    result.properties = result.properties || [];
    result.methods = result.methods || [];
    node.getExtends().map(symbol => symbol.getType().getProperties().forEach((symbol) => {
      symbol.getDeclarations().forEach((declaration) => {
        const structure = declaration.getStructure();
        if (structure.kind === StructureKind.Method || structure.kind === StructureKind.MethodSignature) {
          result.methods.push(structure);
        } else {
          result.properties.push(structure);
        }
      });
    }));
    return result;
  });
}

/**
 * @param {import('ts-morph').Node} node
 * @returns {import('ts-morph').Structure[]}
*/
function getReturnStructure(node) {
  /** @type {import('ts-morph').Type} */
  const returnType = node.getSignature().getReturnType();
  const nodes = returnType.getSymbol().getDeclarations();
  return nodes.map(node => node.getStructure());
}

/**
 * @param {import('ts-morph').Node} node
 * @returns {import('ts-morph').TypeAliasDeclarationStructure}
*/
function getAliasStructure(node) {
  const result = node.getStructure();
  const type = node.getType();
  const properties = type.getProperties().reduce((arr, symbol) => {
    const node = symbol.getValueDeclaration();
    if (node) arr.push(node.getStructure());
    return arr;
  }, []);
  if (properties.length) result.properties = properties;
  return result;
}
