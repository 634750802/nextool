import { describe } from 'node:test';
import { fileType, isFileType } from './fileType';

describe('fileType', () => {
  it('should pass', () => {
    expect(fileType.parse(new File([], 'hi.hi'))).toBeInstanceOf(File);
  });

  it('should pass', () => {
    expect(isFileType(fileType)).toBe(true);
    expect(isFileType(fileType.optional())).toBe(true);
    expect(isFileType(fileType.nullable())).toBe(true);
    expect(isFileType(fileType.transform(t => t.name))).toBe(true);
  });
});