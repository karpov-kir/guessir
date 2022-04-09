import { LexemeBuilder } from './LexemeBuilder';

describe(LexemeBuilder, () => {
  it('should build lexemes', () => {
    // This text covers all cases described in `buildLexeme`
    const lexemes = new LexemeBuilder().buildLexemes(`
    
      ^One;   two#       
      
      
      
      DoN'T! he, she'd  i re—g .
    `);

    expect(lexemes).toEqual({
      lexemes: new Map([
        [0, { endIndex: 3, startIndex: 1, original: 'One', normalized: 'One', uncontracted: 'One', type: 'w' }],
        [1, { endIndex: 4, startIndex: 4, original: ';', normalized: ';', uncontracted: ';', type: 'sc' }],
        [2, { endIndex: 5, startIndex: 5, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [3, { endIndex: 10, startIndex: 8, original: 'two', normalized: 'two', uncontracted: 'two', type: 'w' }],
        [4, { endIndex: 11, startIndex: 11, original: '#', normalized: '#', uncontracted: '#', type: 'sc' }],
        [5, { endIndex: 19, startIndex: 19, original: '\n', normalized: '\n', uncontracted: '\n', type: 'sc' }],
        [6, { endIndex: 26, startIndex: 26, original: '\n', normalized: '\n', uncontracted: '\n', type: 'sc' }],
        [7, { endIndex: 41, startIndex: 41, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [8, { endIndex: 51, startIndex: 47, original: "DoN'T", normalized: 'Do', uncontracted: 'Do not', type: 'w' }],
        [9, { endIndex: 51, startIndex: 47, original: ' ', normalized: ' ', uncontracted: 'Do not', type: 'sc' }],
        [10, { endIndex: 51, startIndex: 47, original: "DoN'T", normalized: 'not', uncontracted: 'Do not', type: 'w' }],
        [11, { endIndex: 52, startIndex: 52, original: '!', normalized: '!', uncontracted: '!', type: 'sc' }],
        [12, { endIndex: 53, startIndex: 53, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [13, { endIndex: 55, startIndex: 54, original: 'he', normalized: 'he', uncontracted: 'he', type: 'w' }],
        [14, { endIndex: 56, startIndex: 56, original: ',', normalized: ',', uncontracted: ',', type: 'sc' }],
        [15, { endIndex: 57, startIndex: 57, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [
          16,
          { endIndex: 62, startIndex: 58, original: "she'd", normalized: "she'd", uncontracted: "she'd", type: 'w' },
        ],
        [17, { endIndex: 63, startIndex: 63, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [18, { endIndex: 65, startIndex: 65, original: 'i', normalized: 'I', uncontracted: 'I', type: 'l' }],
        [19, { endIndex: 66, startIndex: 66, original: ' ', normalized: ' ', uncontracted: ' ', type: 'sc' }],
        [20, { endIndex: 70, startIndex: 67, original: 're—g', normalized: 're-g', uncontracted: 're-g', type: 'w' }],
        [21, { endIndex: 72, startIndex: 72, original: '.', normalized: '.', uncontracted: '.', type: 'sc' }],
      ]),
      lexemesByWordLike: new Map([
        [
          'one',
          new Map([
            [0, { endIndex: 3, startIndex: 1, original: 'One', normalized: 'One', uncontracted: 'One', type: 'w' }],
          ]),
        ],
        [
          'two',
          new Map([
            [3, { endIndex: 10, startIndex: 8, original: 'two', normalized: 'two', uncontracted: 'two', type: 'w' }],
          ]),
        ],
        [
          'do',
          new Map([
            [
              8,
              {
                endIndex: 51,
                startIndex: 47,
                original: "DoN'T",
                normalized: 'Do',
                uncontracted: 'Do not',
                type: 'w',
              },
            ],
          ]),
        ],
        [
          'not',
          new Map([
            [
              10,
              {
                endIndex: 51,
                startIndex: 47,
                original: "DoN'T",
                normalized: 'not',
                uncontracted: 'Do not',
                type: 'w',
              },
            ],
          ]),
        ],
        [
          'he',
          new Map([
            [13, { endIndex: 55, startIndex: 54, original: 'he', normalized: 'he', uncontracted: 'he', type: 'w' }],
          ]),
        ],
        [
          'she',
          new Map([
            [
              16,
              {
                endIndex: 62,
                startIndex: 58,
                original: "she'd",
                normalized: "she'd",
                uncontracted: "she'd",
                type: 'w',
              },
            ],
          ]),
        ],
        [
          "she'd",
          new Map([
            [
              16,
              {
                endIndex: 62,
                startIndex: 58,
                original: "she'd",
                normalized: "she'd",
                uncontracted: "she'd",
                type: 'w',
              },
            ],
          ]),
        ],
        [
          'i',
          new Map([
            [18, { endIndex: 65, startIndex: 65, original: 'i', normalized: 'I', uncontracted: 'I', type: 'l' }],
          ]),
        ],
        [
          're-g',
          new Map([
            [
              20,
              {
                endIndex: 70,
                startIndex: 67,
                original: 're—g',
                normalized: 're-g',
                uncontracted: 're-g',
                type: 'w',
              },
            ],
          ]),
        ],
      ]),
      wordLikeCount: 8,
      specialCharacterCount: 14,
    });
  });
});
