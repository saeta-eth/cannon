import Ajv, { JTDDataType, SomeJTDSchemaType } from 'ajv/dist/jtd';
import { ChainBuilderRuntime } from './runtime';

const ajv = new Ajv();

import contractSpec from './steps/contract';
import importSpec from './steps/import';
import invokeSpec from './steps/invoke';
import keeperSpec from './steps/keeper';
import { ChainArtifacts, ChainBuilderContext, ChainBuilderRuntimeInfo } from './types';

export interface Action {
    configInject: (ctx: ChainBuilderContext, config: any) => any,

    getState: (runtime: ChainBuilderRuntimeInfo, ctx: ChainBuilderContext, config: any) => any,

    exec: (runtime: ChainBuilderRuntime, ctx: ChainBuilderContext, config: any, currentLabel: string) => Promise<ChainArtifacts>,

    validate: {
        properties: Record<string, SomeJTDSchemaType>;
        optionalProperties?: Record<string, SomeJTDSchemaType>;
        additionalProperties?: boolean;
    }
}

/**
 * All the different types (and their implementations)
 */
export let ActionKinds: {[label: string]: Action} = {
};

let ChainDefinitionSchema = {
    properties: {
        name: { type: 'string' },
        version: { type: 'string' },
    },
    optionalProperties: {
        description: { type: 'string' },
        keywords: { elements: { type: 'string' } },
        setting: {
            values: {
                optionalProperties: {
                    description: { type: 'string' },
                    type: { enum: ['number', 'string', 'boolean'] },
                    defaultValue: { type: 'string' },
                },
            },
        },
        
        import: importSpec
    },
} as const;

export type RawChainDefinition = JTDDataType<typeof ChainDefinitionSchema>;

export function registerAction(label: string, action: Action) {

    if (ActionKinds[label]) {
        throw new Error('action kind already declared: ' + label);
    }

    ActionKinds[label] = action;
    (ChainDefinitionSchema.optionalProperties as any)[label] = { values: action.validate };
}

export function getChainDefinitionValidator() {
    console.log('got schema', ChainDefinitionSchema)

    return ajv.compile(ChainDefinitionSchema);
}

registerAction('contract', contractSpec);
registerAction('import', importSpec);
registerAction('invoke', invokeSpec);
registerAction('keeper', keeperSpec);