import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    MistralModel,
    MistralModelAlias,
    TokenizerVersion,
    getTokenizerVersionForModel,
    shouldUseTekkenForModel
} from './commons.js';
import { UnreachableError } from './errors.js';
import type { Tokenizer } from './tokenizers/base.js';
import { SentencePieceBPETokenizer } from './tokenizers/sentence_piece.js';
import { Tekkenizer } from './tokenizers/tekken.js';

class MistralTokenizer {
    #tokenizer: Tokenizer;

    constructor(version: TokenizerVersion, shouldUseTekken: boolean) {
        const tokenizerDataPath = MistralTokenizer.#tokenizerDataPath(
            version,
            shouldUseTekken
        );
        this.#tokenizer = shouldUseTekken
            ? new Tekkenizer(tokenizerDataPath)
            : new SentencePieceBPETokenizer(tokenizerDataPath);
    }

    static #tokenizerDataPath(
        version: TokenizerVersion,
        shouldUseTekken: boolean
    ) {
        const baseDataPath = path.join(
            dirname(fileURLToPath(import.meta.url)),
            '../data'
        );

        switch (version) {
            case TokenizerVersion.V1:
            case TokenizerVersion.V2:
                return path.join(baseDataPath, 'bpe', version);

            case TokenizerVersion.V3:
                if (shouldUseTekken) {
                    return path.resolve(baseDataPath, 'tekken/240718.json');
                }

                return path.join(baseDataPath, 'bpe', version);

            default:
                throw new UnreachableError(version);
        }
    }

    encode(...args: Parameters<Tokenizer['encode']>) {
        return this.#tokenizer.encode(...args);
    }

    decode(...args: Parameters<Tokenizer['decode']>) {
        return this.#tokenizer.decode(...args);
    }
}

export function getTokenizer(
    version: TokenizerVersion,
    shouldUseTekken: boolean
) {
    return new MistralTokenizer(version, shouldUseTekken);
}

export function getTokenizerForModel(
    modelOrAlias: MistralModel | MistralModelAlias
) {
    const tokenizerVersion = getTokenizerVersionForModel(modelOrAlias);
    const shouldUseTekken = shouldUseTekkenForModel(modelOrAlias);

    return getTokenizer(tokenizerVersion, shouldUseTekken);
}

export { MistralModel, MistralModelAlias, TokenizerVersion };
