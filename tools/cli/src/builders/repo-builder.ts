import {
  printNode,
  Project,
  QuoteKind,
  StructureKind,
  VariableDeclarationKind,
} from 'ts-morph';
import { CallExpression, factory, ScriptTarget } from 'typescript';
import { RequestsCacheBuilder } from './requests-cache.builder';
import { ActiveIdsBuilder } from './active-ids.builder';
import { EntitiesBuilder } from './entities.builder';
import { UIEntitiesBuilder } from './ui-entities.builder';
import { RequestsStatusBuilder } from './requests-status.builder';
import { ActiveIdBuilder } from './active-id.builder';
import { PropsBuilder } from './props.builder';
import { camelize, capitalize } from '../utils';
import { Options } from '../types';

export function createRepo(options: Options) {
  const { storeName } = options;

  const project = new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    compilerOptions: {
      target: ScriptTarget.ES2015,
    },
  });

  const sourceFile = project.createSourceFile(`repo.ts`, ``);

  const repoDecl = sourceFile.addClass({
    name: `${capitalize(storeName)}Repository`,
    isExported: true,
  });

  sourceFile.addImportDeclaration({
    moduleSpecifier: '@ngneat/elf',
    namedImports: ['Store', 'createState'].map((name) => ({
      kind: StructureKind.ImportSpecifier,
      name,
    })),
  });

  const builders = [
    RequestsCacheBuilder,
    RequestsStatusBuilder,
    ActiveIdBuilder,
    ActiveIdsBuilder,
    EntitiesBuilder,
    PropsBuilder,
    UIEntitiesBuilder,
  ];

  const propsFactories: CallExpression[] = [];

  for (const feature of options.features) {
    for (const builder of builders) {
      if (builder.supports(feature)) {
        const instance = new builder(sourceFile, repoDecl, options);
        instance.run();
        propsFactories.push(instance.getPropsFactory());
      }
    }
  }

  const state = factory.createCallExpression(
    factory.createIdentifier('createState'),
    undefined,
    propsFactories
  );

  const repoPosition = repoDecl.getChildIndex();

  sourceFile.insertVariableStatement(repoPosition, {
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'store',
        initializer: `new Store({ name: '${camelize(
          storeName
        )}', state, config })`,
      },
    ],
  });

  sourceFile.insertVariableStatement(repoPosition, {
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: '{ state, config }',
        initializer: printNode(state),
      },
    ],
  });

  sourceFile.formatText({ indentSize: 2 });

  return sourceFile.getText();
}
